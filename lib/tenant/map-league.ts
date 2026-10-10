/**
 * Pure mapping from a host resolution result to a concrete league id.
 * Edge-safe / no db or next imports — the caller supplies the known leagues.
 *
 * - platform host  -> 'platform' (no league; console/marketing owns it)
 * - default host   -> the founding league (vercel.app/localhost/unknown)
 * - tenant host    -> the league whose slug matches, or 'unknown_slug'
 *
 * Unknown tenant slugs are NOT silently remapped to the default league: that
 * would let a random/typo subdomain serve league #1's data under a misleading
 * host. The caller decides how to render 'unknown_slug' (e.g. Next notFound()).
 */
import type { ResolvedHost } from './resolve-host';
import { DEFAULT_LEAGUE_ID } from './config';

export type LeagueRecord = { id: number; slug: string; status: string };

export type TenantResolution =
  | { status: 'ok'; leagueId: number; slug: string }
  | { status: 'platform' }
  | { status: 'unknown_slug'; slug: string }
  | { status: 'suspended'; leagueId: number; slug: string };

// Hosts whose league is suspended/trial-closed are surfaced distinctly so the
// app can show a suspended notice instead of data. 'active' and 'trial' serve.
const SERVABLE_STATUSES = new Set(['active', 'trial']);

export function mapResolvedToLeague(
  resolved: ResolvedHost,
  leagues: Pick<LeagueRecord, 'id' | 'slug' | 'status'>[]
): TenantResolution {
  if (resolved.kind === 'platform') {
    return { status: 'platform' };
  }

  // default host → founding league, regardless of DB presence drift.
  if (resolved.kind === 'default') {
    const fallback = leagues.find((l) => l.id === DEFAULT_LEAGUE_ID);
    if (fallback) {
      return SERVABLE_STATUSES.has(fallback.status)
        ? { status: 'ok', leagueId: fallback.id, slug: fallback.slug }
        : { status: 'suspended', leagueId: fallback.id, slug: fallback.slug };
    }
    return { status: 'ok', leagueId: DEFAULT_LEAGUE_ID, slug: resolved.slug ?? '' };
  }

  // tenant host: must match an existing league by slug (no guessing).
  const slug = resolved.slug ?? '';
  const league = leagues.find((l) => l.slug === slug);
  if (!league) return { status: 'unknown_slug', slug };
  if (!SERVABLE_STATUSES.has(league.status)) {
    return { status: 'suspended', leagueId: league.id, slug };
  }
  return { status: 'ok', leagueId: league.id, slug };
}
