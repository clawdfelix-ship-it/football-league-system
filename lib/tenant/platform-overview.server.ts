/**
 * Platform overview dashboard (server-only).
 *
 * Aggregates per-league stats across teams / players / matches so the
 * platform admin can see at a glance which leagues are active and which
 * are stale. Read-only; does not mutate any state.
 */

import { sql, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leagues } from '@/lib/schema';

export type LeagueOverviewRow = {
  leagueId: number;
  slug: string;
  name: string;
  status: string;
  plan: string | null;
  teamCount: number;
  playerCount: number;
  matchCount: number;
  lastActivityAt: Date | null;
};

export type PlatformOverview = {
  leagues: LeagueOverviewRow[];
  totals: {
    activeLeagues: number;
    suspendedLeagues: number;
    totalTeams: number;
    totalPlayers: number;
    totalMatches: number;
  };
};

/**
 * One row per league with aggregate counts.
 *
 * Uses a single SQL query with scalar subselects so we don't need to know
 * the exact FK column names on teams/players/matches (they follow the
 * league_id convention established in migration 0010).
 */
export async function getPlatformOverview(): Promise<PlatformOverview> {
  const rows = await db.execute<{
    league_id: number;
    slug: string;
    name: string;
    status: string;
    plan: string | null;
    team_count: string | number;
    player_count: string | number;
    match_count: string | number;
    last_activity_at: Date | string | null;
  }>(sql`
    SELECT
      l.id            AS league_id,
      l.slug          AS slug,
      l.name          AS name,
      l.status        AS status,
      l.plan          AS plan,
      (SELECT count(*)::int FROM teams   WHERE teams.league_id   = l.id) AS team_count,
      (SELECT count(*)::int FROM players WHERE players.league_id = l.id) AS player_count,
      (SELECT count(*)::int FROM matches WHERE matches.league_id = l.id) AS match_count,
      GREATEST(
        (SELECT max(updated_at) FROM teams   WHERE teams.league_id   = l.id),
        (SELECT max(updated_at) FROM players WHERE players.league_id = l.id),
        (SELECT max(updated_at) FROM matches WHERE matches.league_id = l.id)
      ) AS last_activity_at
    FROM leagues l
    ORDER BY l.created_at ASC
  `);

  const leaguesRows: LeagueOverviewRow[] = (rows.rows ?? []).map((r) => ({
    leagueId: r.league_id,
    slug: r.slug,
    name: r.name,
    status: r.status,
    plan: r.plan,
    teamCount: Number(r.team_count),
    playerCount: Number(r.player_count),
    matchCount: Number(r.match_count),
    lastActivityAt: r.last_activity_at ? new Date(r.last_activity_at) : null,
  }));

  const totals = leaguesRows.reduce(
    (acc, l) => {
      if (l.status === 'active') acc.activeLeagues += 1;
      if (l.status === 'suspended') acc.suspendedLeagues += 1;
      acc.totalTeams += l.teamCount;
      acc.totalPlayers += l.playerCount;
      acc.totalMatches += l.matchCount;
      return acc;
    },
    { activeLeagues: 0, suspendedLeagues: 0, totalTeams: 0, totalPlayers: 0, totalMatches: 0 }
  );

  return { leagues: leaguesRows, totals };
}
