import { eq, isNull, or } from 'drizzle-orm';
import { DEFAULT_LEAGUE_ID } from './config';

/**
 * Treat legacy NULL league bindings as the founding league only.
 *
 * The auth layer still accepts legacy users/managers with NULL `league_id` as
 * belonging to league #1, so mutation paths must scope those rows the same way
 * until every account is backfilled.
 */
export function isLeagueMemberOrLegacyDefault(
  recordLeagueId: number | null | undefined,
  requestedLeagueId: number
): boolean {
  if (requestedLeagueId === DEFAULT_LEAGUE_ID) {
    return recordLeagueId === null || recordLeagueId === undefined || recordLeagueId === DEFAULT_LEAGUE_ID;
  }
  return recordLeagueId === requestedLeagueId;
}

export function whereLeagueMatchesOrLegacyDefault(column: any, requestedLeagueId: number) {
  if (requestedLeagueId === DEFAULT_LEAGUE_ID) {
    return or(eq(column, requestedLeagueId), isNull(column))!;
  }
  return eq(column, requestedLeagueId);
}
