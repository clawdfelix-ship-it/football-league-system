import { ok, fail } from '@/lib/api/response';
import { TeamPasswordSetSchema, TeamPasswordResetSchema } from '@/lib/api/schemas';
import { zodDetails } from '@/lib/api/zod';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';
import { audit } from '@/lib/auth/audit-log';
import { TEAMS } from '@/lib/constants';

/**
 * Admin-only endpoint to manage per-team manager passwords.
 *
 * POST /api/admin/team-passwords
 *   body: { team: "HSBC", password: "..." }
 *   → upserts the manager row for the team's captain emails with new password,
 *     sets must_change_password = now() so they must change it on next login.
 *
 * POST /api/admin/team-passwords  (mode: reset-single)
 *   body: { email: "...", mode: "reset-single" }  — handled in dedicated route
 *
 * Used by /admin/team-passwords UI. Single plaintext is never persisted;
 * it's only hashed before storage.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`admin-team-pw:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return fail(429, 'RATE_LIMITED', 'Too many requests');
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    void audit({
      action: 'admin.manager_account.generate',
      actor: { role: 'anonymous' },
      ip,
      result: 'denied',
      detail: 'admin-team-passwords: no session',
    });
    return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
  }
  if (session.user.role !== 'admin') {
    void audit({
      action: 'admin.manager_account.generate',
      actor: { role: (session.user.role ?? 'user') as 'admin' | 'manager' | 'user', email: session.user.email ?? null },
      ip,
      result: 'denied',
      detail: 'admin-team-passwords: not admin',
    });
    return fail(403, 'FORBIDDEN', 'Admin access required');
  }

  const actor = { role: 'admin' as const, email: session.user.email ?? null, username: null };

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return fail(400, 'VALIDATION_ERROR', 'Invalid JSON body');
  }

  let input: { team: string; password: string };
  try {
    input = TeamPasswordSetSchema.parse(raw);
  } catch (e) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid request body', zodDetails(e));
  }

  const team = TEAMS.find((t) => t.shortName === input.team.toUpperCase() || t.name === input.team);
  if (!team) {
    return fail(404, 'NOT_FOUND', `Unknown team: ${input.team}`);
  }

  // Resolve captain emails from lib/constants (existing source of truth).
  const TEAM_CONTACTS = await import('@/lib/team-contacts').then((m) => m.TEAM_CONTACTS);
  const teamBlock = TEAM_CONTACTS.find((t) => t.team === team.shortName);
  if (!teamBlock) {
    return fail(404, 'NOT_FOUND', `No captain list for team: ${team.shortName}`);
  }

  const passwordHash = await hashPassword(input.password);
  const now = new Date();
  const affectedEmails: string[] = [];

  for (const captain of teamBlock.captains) {
    if (!captain.email) continue;
    const email = captain.email.toLowerCase();
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));

    if (existing) {
      await db
        .update(users)
        .set({ passwordHash, mustChangePassword: now, passwordChangedAt: null })
        .where(eq(users.id, existing.id));
    } else {
      await db.insert(users).values({
        email,
        username: `${team.shortName}-${email.split('@')[0]}`.toLowerCase().slice(0, 50),
        passwordHash,
        role: 'manager',
        mustChangePassword: now,
      });
    }
    affectedEmails.push(email);
  }

  void audit({
    action: 'admin.manager_account.generate',
    actor,
    ip,
    target: { kind: 'team', id: team.shortName },
    result: 'success',
    detail: `team=${team.shortName} affected=${affectedEmails.length} (admin-set, must change on login)`,
  });

  return ok({
    message: `Password set for ${team.shortName}`,
    team: team.shortName,
    affectedEmails,
    mustChangeOnLogin: true,
  });
}

/**
 * POST /api/admin/team-passwords/reset-single
 *   body: { email: "..." }
 *   → generates a random password, updates that single manager, returns the
 *     plaintext exactly once in the response. Admin must capture it.
 */
export async function PUT(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`admin-team-pw-reset:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return fail(429, 'RATE_LIMITED', 'Too many requests');
  }

  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return fail(403, 'FORBIDDEN', 'Admin access required');
  }

  const actor = { role: 'admin' as const, email: session.user.email ?? null, username: null };

  let input: { email: string };
  try {
    input = TeamPasswordResetSchema.parse(await request.json());
  } catch (e) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid request body', zodDetails(e));
  }

  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let raw = '';
  for (let i = 0; i < 12; i++) {
    raw += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  const newPassword = `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6, 9)}-${raw.slice(9, 12)}`;
  const passwordHash = await hashPassword(newPassword);
  const now = new Date();

  const [existing] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, input.email));

  if (!existing) {
    return fail(404, 'NOT_FOUND', 'No account for that email');
  }

  await db
    .update(users)
    .set({ passwordHash, mustChangePassword: now, passwordChangedAt: null })
    .where(eq(users.id, existing.id));

  void audit({
    action: 'admin.manager_account.generate',
    actor,
    ip,
    target: { kind: 'user', id: input.email },
    result: 'success',
    detail: 'single-manager password reset',
  });

  return ok({
    message: 'Password reset. Capture the plaintext below NOW — it will not be shown again.',
    email: input.email,
    plaintextPassword: newPassword,
    mustChangeOnLogin: true,
  });
}