/**
 * League provisioning (Phase 3) — server-only DB service.
 *
 * Lifecycle:
 *   submitApplication()             -> pending row (one active per email)
 *   setApplicationStatus()          -> platform admin moves the state machine
 *   provisionApprovedApplication()  -> idempotently creates the `leagues` row,
 *                                      links it to the application, busts cache
 *
 * NOTE: creating the organiser's *owner login* is intentionally deferred to
 * Phase 5 (RBAC). Today users.role is only global 'admin'|'manager'; minting an
 * 'admin' here would hand the new organiser super-admin over every league. We
 * create the league only, and Phase 5 adds a league-scoped role
 * (platform_admin / league_admin / manager) + the owner account.
 */
import { db } from '@/lib/db';
import { leagueApplications, leagues } from '@/lib/schema';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import {
  assertApplicationTransition,
  canProvision,
  slugifyLeagueName,
  uniqueLeagueSlug,
  type ApplicationStatus,
} from './provisioning';
import { invalidateLeagueDirectory } from './leagues';

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
  if (!email.includes('@')) throw new ApplicationError('Invalid contact email');
  if (!input.leagueName.trim()) throw new ApplicationError('League name is required');
  if (!input.contactName.trim()) throw new ApplicationError('Contact name is required');

  const existing = await db
    .select({ id: leagueApplications.id, status: leagueApplications.status })
    .from(leagueApplications)
    .where(
      and(
        eq(leagueApplications.contactEmail, email)
        // partial unique index covers active states; mirror that in app code
        // for a friendly error rather than a raw unique violation.
      )
    );
  const active = existing.find((e) =>
    ['pending', 'in_review', 'approved'].includes(e.status)
  );
  if (active) {
    throw new ApplicationError(
      `An active application already exists for this email (status: ${active.status})`
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

export type ProvisionResult = {
  created: boolean;
  league: { id: number; slug: string; name: string };
  applicationId: number;
};

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

  // Already provisioned -> idempotent no-op.
  if (app.leagueId != null) {
    const [existing] = await db
      .select({ id: leagues.id, slug: leagues.slug, name: leagues.name })
      .from(leagues)
      .where(eq(leagues.id, app.leagueId));
    if (existing) {
      return { created: false, league: existing, applicationId: id };
    }
  }

  return db.transaction(async (tx) => {
    // Pick a unique slug based on the requested one, else the league name.
    const desired = app.requestedSlug?.trim() || slugifyLeagueName(app.leagueName);
    const takenRows = await tx.select({ slug: leagues.slug }).from(leagues);
    const slug = uniqueLeagueSlug(
      desired,
      takenRows.map((r) => r.slug)
    );

    const [league] = await tx
      .insert(leagues)
      .values({
        slug,
        name: app.leagueName.trim(),
        sportType: app.sportType || 'football',
        status: 'trial', // new tenants start on trial; platform flips to active
      })
      .returning({ id: leagues.id, slug: leagues.slug, name: leagues.name });

    await tx
      .update(leagueApplications)
      .set({ leagueId: league.id, updatedAt: new Date() })
      .where(eq(leagueApplications.id, id));

    await invalidateLeagueDirectory();
    return { created: true, league, applicationId: id };
  });
}

/** List leagues already provisioned (for platform dashboards). */
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
    .innerJoin(leagueApplications, eq(leagueApplications.leagueId, leagues.id))
    .where(isNotNull(leagueApplications.leagueId))
    .orderBy(asc(leagues.createdAt));
}
