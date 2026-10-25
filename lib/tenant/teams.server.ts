/**
 * Teams CRUD (server-only, league-scoped).
 *
 * Replaces the hardcoded TEAMS / TEAM_CONTACTS constants as the source of
 * truth for team data. All operations are scoped to a single league.
 *
 * Deletion policy (migration 0018):
 *   - No players + no matches → hard delete
 *   - Players only            → release players (team_id=NULL) or cascade delete
 *   - Has matches             → refuse; archive instead (keeps history)
 */

import { and, eq, or, asc, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { teams, matches, players } from '@/lib/schema';

export class TeamError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'TeamError';
    this.code = code;
  }
}

export type TeamRow = typeof teams.$inferSelect;

export type TeamInput = {
  name: string;
  shortName?: string;
  nameZh?: string;
  color?: string;
  venue?: string;
  coach?: { name: string; email?: string; phone?: string } | null;
  manager?: { name: string; email?: string; phone?: string } | null;
  captains?: Array<{ name: string; email?: string; phone?: string }> | null;
  sortOrder?: number;
};

export type TeamAssociations = {
  playerCount: number;
  matchCount: number;
};

/** Count players + matches referencing this team. Throws NOT_FOUND if team not in league. */
export async function getTeamAssociations(leagueId: number, teamId: number): Promise<TeamAssociations> {
  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.leagueId, leagueId)))
    .limit(1);

  if (!team) {
    throw new TeamError('NOT_FOUND', `Team ${teamId} not found in league ${leagueId}`);
  }

  const [playerRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(players)
    .where(and(eq(players.leagueId, leagueId), eq(players.teamId, teamId)));

  const [matchRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matches)
    .where(
      and(
        eq(matches.leagueId, leagueId),
        or(eq(matches.homeTeamId, teamId), eq(matches.awayTeamId, teamId))
      )
    );

  return {
    playerCount: Number(playerRow?.count ?? 0),
    matchCount: Number(matchRow?.count ?? 0),
  };
}

/**
 * Delete a team, handling associated players.
 *
 * mode='release': players become free agents (team_id=NULL), team deleted.
 * mode='delete':  players are deleted first, then team deleted.
 *
 * Throws HAS_MATCHES if the team has any match records — archive instead.
 */
export async function deleteTeamCascade(
  leagueId: number,
  teamId: number,
  mode: 'release' | 'delete'
): Promise<void> {
  const assoc = await getTeamAssociations(leagueId, teamId);

  if (assoc.matchCount > 0) {
    throw new TeamError(
      'HAS_MATCHES',
      `Cannot delete — team has ${assoc.matchCount} match record(s). Archive instead.`
    );
  }

  if (mode === 'release') {
    await db
      .update(players)
      .set({ teamId: null, updatedAt: new Date() })
      .where(and(eq(players.leagueId, leagueId), eq(players.teamId, teamId)));
  } else {
    await db
      .delete(players)
      .where(and(eq(players.leagueId, leagueId), eq(players.teamId, teamId)));
  }

  await db.delete(teams).where(eq(teams.id, teamId));
}

/** Archive a team (hide from new matches + listings, keep history). */
export async function archiveTeam(leagueId: number, teamId: number): Promise<void> {
  const [team] = await db
    .select({ id: teams.id, status: teams.status })
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.leagueId, leagueId)))
    .limit(1);

  if (!team) {
    throw new TeamError('NOT_FOUND', `Team ${teamId} not found in league ${leagueId}`);
  }
  if (team.status === 'archived') return;

  await db
    .update(teams)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(eq(teams.id, teamId));
}

/** Un-archive a team back to active. */
export async function unarchiveTeam(leagueId: number, teamId: number): Promise<void> {
  const [team] = await db
    .select({ id: teams.id, status: teams.status })
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.leagueId, leagueId)))
    .limit(1);

  if (!team) {
    throw new TeamError('NOT_FOUND', `Team ${teamId} not found in league ${leagueId}`);
  }
  if (team.status === 'active') return;

  await db
    .update(teams)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(teams.id, teamId));
}

/** List all teams for a league, ordered by sort_order then id. */
export async function listTeamsForLeague(leagueId: number, opts?: { includeArchived?: boolean }): Promise<TeamRow[]> {
  const conditions = [eq(teams.leagueId, leagueId)];
  if (!opts?.includeArchived) {
    conditions.push(eq(teams.status, 'active'));
  }
  return db
    .select()
    .from(teams)
    .where(and(...conditions))
    .orderBy(asc(teams.sortOrder), asc(teams.id));
}

/** Create a new team in a league. Throws TeamError on duplicate name / invalid input. */
export async function createTeam(leagueId: number, input: TeamInput): Promise<TeamRow> {
  const name = input.name.trim();
  if (!name) {
    throw new TeamError('INVALID_INPUT', 'Team name is required');
  }

  // Check duplicate name in this league
  const [existing] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.leagueId, leagueId), eq(teams.name, name)))
    .limit(1);

  if (existing) {
    throw new TeamError('NAME_TAKEN', `A team named "${name}" already exists in this league`);
  }

  const [team] = await db
    .insert(teams)
    .values({
      name,
      shortName: input.shortName?.trim() || name.slice(0, 20).toUpperCase(),
      nameZh: input.nameZh?.trim() || null,
      color: input.color?.trim() || null,
      venue: input.venue?.trim() || null,
      coach: input.coach ?? null,
      manager: input.manager ?? null,
      captains: input.captains ?? null,
      sortOrder: input.sortOrder ?? null,
      leagueId,
    })
    .returning();

  return team;
}

/** Update a team. Throws TeamError NOT_FOUND if the team doesn't belong to this league. */
export async function updateTeam(
  leagueId: number,
  teamId: number,
  input: Partial<TeamInput>
): Promise<void> {
  const [existing] = await db
    .select({ id: teams.id, leagueId: teams.leagueId })
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.leagueId, leagueId)))
    .limit(1);

  if (!existing) {
    throw new TeamError('NOT_FOUND', `Team ${teamId} not found in league ${leagueId}`);
  }

  // If renaming, check duplicate
  if (input.name) {
    const name = input.name.trim();
    const [dupe] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(and(eq(teams.leagueId, leagueId), eq(teams.name, name), sql`${teams.id} != ${teamId}`))
      .limit(1);
    if (dupe) {
      throw new TeamError('NAME_TAKEN', `A team named "${name}" already exists in this league`);
    }
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.shortName !== undefined) updates.shortName = input.shortName.trim();
  if (input.nameZh !== undefined) updates.nameZh = input.nameZh.trim();
  if (input.color !== undefined) updates.color = input.color.trim();
  if (input.venue !== undefined) updates.venue = input.venue.trim();
  if (input.coach !== undefined) updates.coach = input.coach;
  if (input.manager !== undefined) updates.manager = input.manager;
  if (input.captains !== undefined) updates.captains = input.captains;
  if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;

  await db.update(teams).set(updates).where(eq(teams.id, teamId));
}

/**
 * Delete a team. Throws TeamError:
 *   NOT_FOUND  — team doesn't belong to this league
 *   HAS_MATCHES — team has match records (deleting would break FK)
 *   HAS_PLAYERS — team has player records (must reassign or delete first)
 */
export async function deleteTeam(leagueId: number, teamId: number): Promise<void> {
  const [existing] = await db
    .select({ id: teams.id, leagueId: teams.leagueId, name: teams.name })
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.leagueId, leagueId)))
    .limit(1);

  if (!existing) {
    throw new TeamError('NOT_FOUND', `Team ${teamId} not found in league ${leagueId}`);
  }

  // Check matches (FK constraint)
  const [match] = await db
    .select({ id: matches.id })
    .from(matches)
    .where(
      and(
        eq(matches.leagueId, leagueId),
        or(eq(matches.homeTeamId, teamId), eq(matches.awayTeamId, teamId))
      )
    )
    .limit(1);

  if (match) {
    throw new TeamError(
      'HAS_MATCHES',
      `Cannot delete "${existing.name}" — it has match records. Delete or reassign the matches first.`
    );
  }

  // Check players
  const [player] = await db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.leagueId, leagueId), eq(players.teamId, teamId)))
    .limit(1);

  if (player) {
    throw new TeamError(
      'HAS_PLAYERS',
      `Cannot delete "${existing.name}" — it has player records. Delete or reassign the players first.`
    );
  }

  await db.delete(teams).where(eq(teams.id, teamId));
}
