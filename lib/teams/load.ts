/**
 * Server-side team loader — reads teams from DB (source of truth since
 * migration 0016), falls back to hardcoded TEAMS for the founding league
 * if the DB is empty (legacy/safety).
 *
 * Returns the same shape as the old TEAMS constant so display components
 * don't need to change their rendering logic.
 */

import { cache } from 'react';
import { listTeamsForLeague } from '@/lib/tenant/teams.server';
import { getRequestLeagueId } from '@/lib/tenant/context';
import { TEAMS } from '@/lib/constants';

export type TeamDisplay = {
  name: string;
  nameZh: string;
  shortName: string;
  color: string;
  venue?: string | null;
  coach?: { name: string; email?: string; phone?: string } | null;
  manager?: { name: string; email?: string; phone?: string } | null;
  captains?: Array<{ name: string; email?: string; phone?: string }> | null;
};

/**
 * React `cache` dedupes within a single request — multiple components calling
 * this in one render tree only hit the DB once.
 */
export const getTeamsForCurrentLeague = cache(async (): Promise<TeamDisplay[]> => {
  try {
    const leagueId = await getRequestLeagueId();
    const rows = await listTeamsForLeague(leagueId);
    if (rows.length === 0) {
      // Legacy fallback: founding league with no DB teams yet
      return TEAMS;
    }
    return rows.map((t) => ({
      name: t.name,
      nameZh: t.nameZh ?? t.name,
      shortName: t.shortName ?? t.name,
      color: t.color ?? 'from-slate-600 to-slate-800',
      venue: t.venue,
      coach: t.coach as TeamDisplay['coach'],
      manager: t.manager as TeamDisplay['manager'],
      captains: t.captains as TeamDisplay['captains'],
    }));
  } catch (e) {
    // DB failure must not break public pages — fall back to hardcoded list
    console.error('[teams] DB load failed, falling back to hardcoded TEAMS:', e);
    return TEAMS;
  }
});
