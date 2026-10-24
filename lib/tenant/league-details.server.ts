/**
 * League details for the platform console (server-only).
 *
 * Read-only aggregation for ONE league: stats, recent matches, managers,
 * and a synthesized activity feed. Powers the league detail page in the
 * platform console.
 */

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export type LeagueDetails = {
  league: {
    id: number;
    slug: string;
    name: string;
    status: string;
    plan: string | null;
    createdAt: Date;
  };
  stats: {
    teamCount: number;
    playerCount: number;
    matchCount: number;
    announcementCount: number;
  };
  recentMatches: Array<{
    id: number;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    matchDate: string | null;
    updatedAt: Date | null;
  }>;
  managers: Array<{
    id: number;
    email: string;
    username: string;
    role: string | null;
    lastSignIn: Date | null;
  }>;
  recentActivity: Array<{
    kind: 'match' | 'team' | 'player' | 'announcement';
    label: string;
    happenedAt: Date | null;
  }>;
};

export async function getLeagueDetails(leagueId: number): Promise<LeagueDetails | null> {
  // 1. League row
  const leagueRes = await db.execute<Record<string, unknown>>(sql`
    SELECT id, slug, name, status, plan, created_at
    FROM leagues
    WHERE id = ${leagueId}
    LIMIT 1
  `);
  const leagueRow = (leagueRes.rows ?? [])[0];
  if (!leagueRow) return null;

  // 2. Aggregate stats
  const statsRes = await db.execute<Record<string, unknown>>(sql`
    SELECT
      (SELECT count(*)::int FROM teams         WHERE league_id = ${leagueId}) AS team_count,
      (SELECT count(*)::int FROM players       WHERE league_id = ${leagueId}) AS player_count,
      (SELECT count(*)::int FROM matches       WHERE league_id = ${leagueId}) AS match_count,
      (SELECT count(*)::int FROM announcements WHERE league_id = ${leagueId}) AS announcement_count
  `);
  const statsRow = (statsRes.rows ?? [])[0] ?? {};

  // 3. Recent matches (last 10 by updated_at)
  // NB: the matches column is `date`, aliased to match_date for the API shape.
  const matchesRes = await db.execute<Record<string, unknown>>(sql`
    SELECT id, home_team, away_team, home_score, away_score, date AS match_date, updated_at
    FROM matches
    WHERE league_id = ${leagueId}
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 10
  `);

  // 4. Managers (users scoped to this league)
  const managersRes = await db.execute<Record<string, unknown>>(sql`
    SELECT id, email, username, role, password_changed_at
    FROM users
    WHERE league_id = ${leagueId}
    ORDER BY created_at ASC
  `);

  // 5. Recent activity: union of latest match/team/player/announcement updates
  const activityRes = await db.execute<Record<string, unknown>>(sql`
    (
      SELECT
        'match' AS kind,
        (home_team || ' vs ' || away_team ||
          CASE
            WHEN home_score IS NOT NULL AND away_score IS NOT NULL
              THEN ' — ' || home_score || ':' || away_score
            ELSE ''
          END
        ) AS label,
        updated_at AS happened_at
      FROM matches
      WHERE league_id = ${leagueId}
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 5
    )
    UNION ALL
    (
      SELECT
        'team' AS kind,
        'Team: ' || name AS label,
        updated_at AS happened_at
      FROM teams
      WHERE league_id = ${leagueId}
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 5
    )
    UNION ALL
    (
      SELECT
        'player' AS kind,
        'Player: ' || name AS label,
        updated_at AS happened_at
      FROM players
      WHERE league_id = ${leagueId}
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 5
    )
    UNION ALL
    (
      SELECT
        'announcement' AS kind,
        'Announcement: ' || coalesce(title, '(untitled)') AS label,
        updated_at AS happened_at
      FROM announcements
      WHERE league_id = ${leagueId}
      ORDER BY updated_at DESC NULLS LAST
      LIMIT 5
    )
    ORDER BY happened_at DESC NULLS LAST
    LIMIT 20
  `);

  return {
    league: {
      id: Number(leagueRow.id),
      slug: String(leagueRow.slug),
      name: String(leagueRow.name),
      status: String(leagueRow.status),
      plan: (leagueRow.plan as string | null) ?? null,
      createdAt: new Date(leagueRow.created_at as string),
    },
    stats: {
      teamCount: Number(statsRow.team_count ?? 0),
      playerCount: Number(statsRow.player_count ?? 0),
      matchCount: Number(statsRow.match_count ?? 0),
      announcementCount: Number(statsRow.announcement_count ?? 0),
    },
    recentMatches: (matchesRes.rows ?? []).map((r) => ({
      id: Number(r.id),
      homeTeam: String(r.home_team ?? ''),
      awayTeam: String(r.away_team ?? ''),
      homeScore: r.home_score == null ? null : Number(r.home_score),
      awayScore: r.away_score == null ? null : Number(r.away_score),
      matchDate: (r.match_date as string | null) ?? null,
      updatedAt: r.updated_at ? new Date(r.updated_at as string) : null,
    })),
    managers: (managersRes.rows ?? []).map((r) => ({
      id: Number(r.id),
      email: String(r.email),
      username: String(r.username),
      role: (r.role as string | null) ?? null,
      lastSignIn: r.password_changed_at ? new Date(r.password_changed_at as string) : null,
    })),
    recentActivity: (activityRes.rows ?? []).map((r) => ({
      kind: String(r.kind) as LeagueDetails['recentActivity'][number]['kind'],
      label: String(r.label ?? ''),
      happenedAt: r.happened_at ? new Date(r.happened_at as string) : null,
    })),
  };
}
