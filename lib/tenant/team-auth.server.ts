/**
 * Team auth migration helpers (server-only).
 *
 * Phase B: moves team identity from TEAMS array index to DB teams.id.
 * Safe for existing sessions: array-index teamId continues to work via
 * fallback until the user re-logs in or the session is migrated.
 */

import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, teams } from '@/lib/schema';
import { TEAMS } from '@/lib/constants';
import { DEFAULT_LEAGUE_ID } from '@/lib/tenant/config';

export class TeamAuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'TeamAuthError';
    this.code = code;
  }
}

/**
 * Resolve a manager's team DB id.
 *
 * Priority:
 *   1. users.team_id (if set — already migrated)
 *   2. Email prefix match against DB teams.shortName (fallback for legacy)
 *   3. null (unknown)
 */
export async function resolveManagerTeamDbId(email: string): Promise<number | null> {
  const inputEmail = email.toLowerCase();

  // 1. Check if user already has team_id set
  const [user] = await db
    .select({ teamId: users.teamId, leagueId: users.leagueId })
    .from(users)
    .where(eq(users.email, inputEmail))
    .limit(1);

  if (!user) {
    return null;
  }

  if (user?.teamId != null) {
    return user.teamId;
  }

  // 2. Fallback: email prefix → shortName lookup
  const emailPrefix = inputEmail.split('@')[0].toUpperCase();
  if (!emailPrefix) return null;
  const leagueId =
    typeof user.leagueId === 'number' && user.leagueId > 0
      ? user.leagueId
      : DEFAULT_LEAGUE_ID;

  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.shortName, emailPrefix), eq(teams.leagueId, leagueId)))
    .limit(1);

  return team?.id ?? null;
}

/**
 * Get team name from DB id. Returns null if not found.
 */
export async function getTeamNameFromDbId(teamId: number): Promise<string | null> {
  const [team] = await db
    .select({ name: teams.name })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  return team?.name ?? null;
}

/**
 * Migrate a legacy session's array-index teamId to DB id.
 * Writes the resolved DB id to users.team_id for future logins.
 *
 * Throws TeamAuthError on failure.
 */
export async function migrateSessionTeamId(
  email: string,
  arrayIndex: number
): Promise<number> {
  const inputEmail = email.toLowerCase();

  // Check if already migrated
  const [user] = await db
    .select({ id: users.id, teamId: users.teamId, email: users.email, leagueId: users.leagueId })
    .from(users)
    .where(eq(users.email, inputEmail))
    .limit(1);

  if (!user) {
    throw new TeamAuthError('USER_NOT_FOUND', `User ${email} not found`);
  }

  if (user.teamId != null) {
    return user.teamId; // already migrated
  }

  // Resolve array index → team shortName → DB id
  const teamDisplay = TEAMS[arrayIndex];
  if (!teamDisplay) {
    throw new TeamAuthError('MIGRATION_FAILED', `Invalid array index ${arrayIndex}`);
  }

  const leagueId =
    typeof user.leagueId === 'number' && user.leagueId > 0
      ? user.leagueId
      : DEFAULT_LEAGUE_ID;

  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.shortName, teamDisplay.shortName), eq(teams.leagueId, leagueId)))
    .limit(1);

  if (!team) {
    throw new TeamAuthError('MIGRATION_FAILED', `Team ${teamDisplay.shortName} not found in DB`);
  }

  // Persist
  await db
    .update(users)
    .set({ teamId: team.id })
    .where(eq(users.id, user.id));

  return team.id;
}
