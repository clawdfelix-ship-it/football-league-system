/**
 * League provisioning (Phase 3) — server-only DB service.
 *
 * Lifecycle:
 *   submitApplication()             -> pending row (one active per email)
 *   setApplicationStatus()          -> platform admin moves the state machine
 *   provisionApprovedApplication()  -> idempotently creates the `leagues` row,
 *                                      links it to the application, busts cache,
 *                                      and mints the organiser's league-scoped
 *                                      owner login (role='admin' + league_id).
 *
 * Owner login: a users row with role='admin' and league_id set. Login is
 * host-bound (lib/auth), so this admin can only reach its own league and is
 * rejected on the platform host / other tenants — it is NOT a super-admin.
 * The one-time password is returned exactly once for the welcome email and is
 * never stored in plaintext (only the bcrypt hash is persisted).
 */
import { db } from '@/lib/db';
import { leagueApplications, leagues, users } from '@/lib/schema';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';
import { generateTempPassword } from '@/lib/auth/temp-password';
import {
  assertApplicationTransition,
  canProvision,
  isReservedSlug,
  isValidContactEmail,
  isValidLeagueSlug,
  slugifyLeagueName,
  uniqueLeagueSlug,
  uniqueOwnerUsername,
  type ApplicationStatus,
} from './provisioning';
import { invalidateLeagueDirectory } from './leagues';
import { trialEndsFrom } from './config';
import { ensureTenantCert } from './vercel-tls';

export type SubmitApplicationInput = {
  leagueName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  sportType?: string;
  teamCountEst?: number | null;
  notes?: string | null;
  requestedSlug?: string | null;
};

export class ApplicationError extends Error {}

/** Create a pending application. Throws if an active one already exists. */
export async function submitApplication(input: SubmitApplicationInput) {
  const email = input.contactEmail.trim().toLowerCase();
  if (!isValidContactEmail(email)) throw new ApplicationError('Invalid contact email');
  if (!input.leagueName.trim()) throw new ApplicationError('League name is required');
  if (!input.contactName.trim()) throw new ApplicationError('Contact name is required');
  if (
    input.requestedSlug != null &&
    input.requestedSlug.trim() !== '' &&
    (!isValidLeagueSlug(input.requestedSlug) || isReservedSlug(input.requestedSlug))
  ) {
    throw new ApplicationError('Requested slug is invalid or reserved');
  }
  if (input.teamCountEst != null && (!Number.isInteger(input.teamCountEst) || input.teamCountEst < 0)) {
    throw new ApplicationError('Invalid team count estimate');
  }

  const active = await db
    .select({ id: leagueApplications.id, status: leagueApplications.status })
    .from(leagueApplications)
    .where(
      and(
        eq(leagueApplications.contactEmail, email),
        inArray(leagueApplications.status, ['pending', 'in_review', 'approved'])
      )
    )
    .limit(1);
  if (active.length > 0) {
    throw new ApplicationError(
      `An active application already exists for this email (status: ${active[0].status})`
    );
  }

  const [row] = await db
    .insert(leagueApplications)
    .values({
      leagueName: input.leagueName.trim(),
      contactName: input.contactName.trim(),
      contactEmail: email,
      contactPhone: input.contactPhone ?? null,
      sportType: input.sportType?.trim() || 'football',
      teamCountEst: input.teamCountEst ?? null,
      notes: input.notes ?? null,
      requestedSlug: input.requestedSlug ?? null,
      status: 'pending',
    })
    .returning();
  return row;
}

export async function listApplications(status?: ApplicationStatus) {
  if (status) {
    return db
      .select()
      .from(leagueApplications)
      .where(eq(leagueApplications.status, status))
      .orderBy(asc(leagueApplications.createdAt));
  }
  return db
    .select()
    .from(leagueApplications)
    .orderBy(asc(leagueApplications.createdAt));
}

export async function getApplication(id: number) {
  const [row] = await db
    .select()
    .from(leagueApplications)
    .where(eq(leagueApplications.id, id));
  return row ?? null;
}

/**
 * Move an application through the state machine.
 * `reviewerId` is the platform admin performing the action.
 */
export async function setApplicationStatus(
  id: number,
  to: ApplicationStatus,
  reviewerId: number | null,
  reviewNotes?: string | null
) {
  const app = await getApplication(id);
  if (!app) throw new ApplicationError('Application not found');

  // Pure guard throws on illegal transition.
  assertApplicationTransition(app.status as ApplicationStatus, to);

  const [row] = await db
    .update(leagueApplications)
    .set({
      status: to,
      reviewNotes: reviewNotes !== undefined ? reviewNotes : app.reviewNotes,
      reviewedBy: reviewerId,
      reviewedAt: to === 'pending' ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(leagueApplications.id, id))
    .returning();
  return row;
}

/**
 * Update only the review notes WITHOUT moving the state machine (a same-status
 * write through setApplicationStatus would be rejected as a self-transition).
 * Does not stamp reviewed_at so a pending application stays unreviewed.
 */
export async function setApplicationReviewNotes(id: number, notes: string | null) {
  const [row] = await db
    .update(leagueApplications)
    .set({ reviewNotes: notes, updatedAt: new Date() })
    .where(eq(leagueApplications.id, id))
    .returning();
  return row;
}

export type ProvisionResult = {
  created: boolean;
  league: { id: number; slug: string; name: string };
  applicationId: number;
  /** Best-effort TLS provisioning outcome for the tenant hostname. */
  cert?: import('./vercel-tls').CertResult;
  /** The organiser's league-scoped owner login. */
  owner: {
    email: string;
    username: string;
    /** Present ONLY for a freshly minted account; null if the account already existed. */
    tempPassword: string | null;
    created: boolean;
  };
};

/**
 * Ensure the organiser has exactly one league-scoped owner login
 * (role='admin', league_id = league.id) for their contact email.
 * Idempotent: a re-provision returns the existing account and does NOT reset
 * its password (tempPassword: null). The plaintext temp password is returned
 * only once, when the account is first created, for the welcome email.
 */
async function ensureLeagueOwner(
  league: { id: number; slug: string; name: string },
  contactEmail: string
): Promise<{ email: string; username: string; tempPassword: string | null; created: boolean }> {
  const email = contactEmail.trim().toLowerCase();

  const [existing] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      leagueId: users.leagueId,
    })
    .from(users)
    .where(eq(users.email, email));

  if (existing) {
    // Account exists. Make sure it is bound to THIS league as an admin. We do
    // not touch passwords or other leagues here; if the email is bound to a
    // different league, leave it untouched and surface for the operator.
    if (existing.role === 'admin' && existing.leagueId === league.id) {
      return { email, username: existing.username, tempPassword: null, created: false };
    }
    throw new ApplicationError(
      `Owner email ${email} already exists (role=${existing.role}, league=${existing.leagueId ?? 'null'}); cannot auto-create owner`
    );
  }

  const nameRows = await db.select({ username: users.username }).from(users);
  const taken = new Set(nameRows.map((r) => r.username));
  const username = uniqueOwnerUsername(league.slug, taken);
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await db.insert(users).values({
    email,
    username,
    passwordHash,
    role: 'admin',
    leagueId: league.id,
    mustChangePassword: new Date(),
  });

  return { email, username, tempPassword, created: true };
}

/**
 * Create the league for an approved application. IDEMPOTENT: if the
 * application already has league_id, return the existing league without
 * creating anything. Runs in a transaction and de-dupes the slug against
 * existing leagues so two "Summer Cup" applications get summer-cup / -2.
 */
export async function provisionApprovedApplication(
  id: number
): Promise<ProvisionResult> {
  const app = await getApplication(id);
  if (!app) throw new ApplicationError('Application not found');
  if (!canProvision(app.status as ApplicationStatus)) {
    throw new ApplicationError(
      `Application must be approved before provisioning (current: ${app.status})`
    );
  }

  // Already provisioned -> league already exists. Still make sure the owner
  // login exists (a prior run could have created the league but failed before
  // minting the owner), then return without re-creating anything.
  if (app.leagueId != null) {
    const [existing] = await db
      .select({ id: leagues.id, slug: leagues.slug, name: leagues.name })
      .from(leagues)
      .where(eq(leagues.id, app.leagueId));
    if (existing) {
      const owner = await ensureLeagueOwner(existing, app.contactEmail);
      return { created: false, league: existing, applicationId: id, owner };
    }
  }

  // NOTE: drizzle-orm/neon-http has NO interactive db.transaction() (it throws
  // "No transactions support in neon-http driver"); this app uses the stateless
  // HTTP driver. Provisioning is a low-concurrency manual admin action, so we do
  // sequential statements and rely on: (a) the idempotency guard above keyed on
  // application.league_id, and (b) the leagues.slug UNIQUE constraint to reject
  // the theoretical concurrent duplicate insert. If atomicity ever becomes
  // required (high-volume self-serve), switch provisioning (and only it) to the
  // Neon pooled WebSocket driver via drizzle-orm/neon-serverless.

  // Pick a unique slug based on the requested one, else the league name.
  // Never allow a platform-reserved hostname (admin/www/api/...).
  const requested = app.requestedSlug?.trim();
  const useRequested =
    requested && isValidLeagueSlug(requested) && !isReservedSlug(requested);
  const desired = useRequested ? requested : slugifyLeagueName(app.leagueName);
  const takenRows = await db.select({ slug: leagues.slug }).from(leagues);
  const taken = takenRows.map((r) => r.slug);
  // If the derived name collided with a reserved word, prefix it.
  const baseSlug = isReservedSlug(desired) ? `league-${desired}` : desired;
  let slug = uniqueLeagueSlug(baseSlug, taken);

  // Stamp the trial window up front so a freshly provisioned league auto-closes
  // when the trial lapses (map-league treats a past trial_ends_at as suspended).
  const trialEndsAt = trialEndsFrom();

  const leagueValues = {
    slug,
    name: app.leagueName.trim(),
    sportType: app.sportType || 'football',
    status: 'trial' as const, // new tenants start on trial; platform flips to active
    ...(trialEndsAt ? { trialEndsAt } : {}),
  };

  let league: { id: number; slug: string; name: string };
  try {
    [league] = await db
      .insert(leagues)
      .values(leagueValues)
      .returning({ id: leagues.id, slug: leagues.slug, name: leagues.name });
  } catch (err) {
    // Race: another provisioning committed the same slug between our SELECT
    // and INSERT (Postgres 23505 unique_violation). Re-read and de-dupe once.
    if (!(err instanceof Error) || !/23505|unique/i.test(err.message)) throw err;
    const retryRows = await db.select({ slug: leagues.slug }).from(leagues);
    slug = uniqueLeagueSlug(baseSlug, retryRows.map((r) => r.slug));
    [league] = await db
      .insert(leagues)
      .values({ ...leagueValues, slug })
      .returning({ id: leagues.id, slug: leagues.slug, name: leagues.name });
  }

  await db
    .update(leagueApplications)
    .set({ leagueId: league.id, updatedAt: new Date() })
    .where(eq(leagueApplications.id, id));

  // Mint the organiser's league-scoped owner login. The temp password is
  // surfaced once in ProvisionResult.owner for the welcome email. If this
  // throws (e.g. owner email already used by another league), provisioning
  // surfaces the error; the league row exists and a corrected re-run is
  // idempotent (the early-return path re-enters ensureLeagueOwner).
  const owner = await ensureLeagueOwner(league, app.contactEmail);

  await invalidateLeagueDirectory();

  // Best-effort TLS for the new tenant hostname. External DNS (GoDaddy) means
  // Vercel cannot mint a wildcard cert, so we request a single-host cert via
  // HTTP-01 (validated through the wildcard CNAME). Never fail provisioning
  // over a certificate hiccup — the cert can be issued later.
  const cert = await ensureTenantCert(slug);
  if (!cert.ok && !cert.skipped) {
    console.warn(`[tenant] cert issue pending for ${slug}: ${cert.error}`);
  }

  return { created: true, league, applicationId: id, cert, owner };
}

/**
 * List every league that exists (platform dashboard). Uses a LEFT join to
 * league_applications so the founding league (created directly, with no
 * application) and any manually-provisioned league still appear.
 */
export async function listProvisionedLeagues() {
  return db
    .select({
      id: leagues.id,
      slug: leagues.slug,
      name: leagues.name,
      status: leagues.status,
      plan: leagues.plan,
      createdAt: leagues.createdAt,
    })
    .from(leagues)
    .leftJoin(leagueApplications, eq(leagueApplications.leagueId, leagues.id))
    .orderBy(asc(leagues.createdAt));
}
