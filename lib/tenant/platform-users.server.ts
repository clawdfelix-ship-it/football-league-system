/**
 * Platform user management (server-only).
 *
 * Platform admins can search users across all leagues and reset a user's
 * password (sets a temporary password and flags mustChangePassword).
 *
 * Platform admins are env-based principals, so they are identified by email
 * and may not have a users row. See docs/platform-console-p0-spec.md §3.3.
 */

import { eq, ilike, or, and, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, leagues, platformAuditEvents } from '@/lib/schema';
import { hashPassword } from '@/lib/auth/password';
import { generateTempPassword } from '@/lib/auth/temp-password';

export class PlatformUserError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'PlatformUserError';
    this.code = code;
  }
}

export type PlatformUserRow = {
  id: number;
  email: string;
  username: string;
  role: string | null;
  leagueId: number | null;
  leagueSlug: string | null;
  leagueName: string | null;
  mustChangePassword: Date | null;
  createdAt: Date | null;
};

/**
 * Search users by email or username substring (case-insensitive).
 * Returns joined league slug/name for context.
 */
export async function searchPlatformUsers(query: string): Promise<PlatformUserRow[]> {
  const q = `%${query.trim()}%`;
  if (!q || q === '%%') return [];

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      leagueId: users.leagueId,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt,
      leagueSlug: leagues.slug,
      leagueName: leagues.name,
    })
    .from(users)
    .leftJoin(leagues, eq(users.leagueId, leagues.id))
    .where(or(ilike(users.email, q), ilike(users.username, q)))
    .limit(50);

  return rows;
}

/**
 * Reset a user's password to a temporary one.
 *
 * Throws PlatformUserError on NOT_FOUND / FORBIDDEN_TARGET.
 * Writes an audit row; failure to audit does not block the reset.
 *
 * Returns the plaintext temp password (shown once to the admin).
 */
export async function resetUserPassword(
  userId: number,
  actor: { email: string; userId?: number | null }
): Promise<{ email: string; tempPassword: string }> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      leagueId: users.leagueId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new PlatformUserError('NOT_FOUND', `User ${userId} not found`);
  }

  // Platform admins are env-based and do not have a users row; refuse to
  // reset a row that looks like a platform admin (leagueId IS NULL + admin).
  if (user.leagueId === null && user.role === 'admin') {
    throw new PlatformUserError(
      'FORBIDDEN_TARGET',
      'Cannot reset a platform admin account (no DB row)'
    );
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  await db
    .update(users)
    .set({
      passwordHash,
      mustChangePassword: new Date(),
    })
    .where(eq(users.id, userId));

  // Audit — swallowed on failure, matching recordPlatformEvent policy.
  try {
    await db.insert(platformAuditEvents).values({
      actorEmail: actor.email,
      actorUserId: actor.userId ?? null,
      action: 'user.reset_password',
      targetType: 'user',
      targetId: user.id,
      targetLabel: `${user.username} <${user.email}>`,
      metadata: {
        targetEmail: user.email,
        targetUsername: user.username,
        targetRole: user.role,
        targetLeagueId: user.leagueId,
      },
    });
  } catch (e) {
    console.error('[audit] failed to record user.reset_password:', e);
  }

  return { email: user.email, tempPassword };
}
