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

export type LeagueRecord = {
  id: number;
  slug: string;
  status: string;
  trialEndsAt?: Date | string | null;
};

export type TenantResolution =
  | { status: 'ok'; leagueId: number; slug: string }
  | { status: 'platform' }
  | { status: 'unknown_slug'; slug: string }
  | {
      status: 'suspended';
      leagueId: number;
      slug: string;
      reason?: SuspendedReason;
    };

export type SuspendedReason = 'status' | 'trial_expired';

/**
 * Pure servability check shared by host resolution (mapResolvedToLeague) and
 * the credentials callback (resolve-league.server). A row is servable only when
 * status is active/trial AND a trial league has not passed trial_ends_at.
 *
 * - 'active' always serves regardless of trial_ends_at (paid league).
 * - 'trial' serves only while trial_ends_at is null OR still in the future.
 *   A lapsed trial is treated as suspended (reason 'trial_expired') without
 *   mutating the DB row; flipping status back is an admin/billing action.
 * - pending/suspended/closed never serve.
 *
 * `now` is injectable for deterministic tests; defaults to the clock.
 */
export function isLeagueServable(
  league: Pick<LeagueRecord, 'status' | 'trialEndsAt'>,
  now: Date = new Date()
): boolean {
  if (league.status === 'active') return true;
  if (league.status !== 'trial') return false;
  // Trial with no end date is an open-ended trial (still servable); billing is
  // expected to stamp an end date on provision.
  if (league.trialEndsAt == null) return true;
  const end =
    typeof league.trialEndsAt === 'string'
      ? new Date(league.trialEndsAt)
      : league.trialEndsAt;
  return end.getTime() > now.getTime();
}

/** Why a non-servable league is blocked — drives the notice copy. */
export function suspendedReason(
  league: Pick<LeagueRecord, 'status' | 'trialEndsAt'>,
  now: Date = new Date()
): SuspendedReason {
  return league.status === 'trial' && !isLeagueServable(league, now)
    ? 'trial_expired'
    : 'status';
}

export function mapResolvedToLeague(
  resolved: ResolvedHost,
  leagues: Pick<LeagueRecord, 'id' | 'slug' | 'status' | 'trialEndsAt'>[]
): TenantResolution {
  if (resolved.kind === 'platform') {
    return { status: 'platform' };
  }

  // default host → founding league, regardless of DB presence drift.
  if (resolved.kind === 'default') {
    const fallback = leagues.find((l) => l.id === DEFAULT_LEAGUE_ID);
    if (fallback) {
      return isLeagueServable(fallback)
        ? { status: 'ok', leagueId: fallback.id, slug: fallback.slug }
        : {
            status: 'suspended',
            leagueId: fallback.id,
            slug: fallback.slug,
            reason: suspendedReason(fallback),
          };
    }
    return { status: 'ok', leagueId: DEFAULT_LEAGUE_ID, slug: resolved.slug ?? '' };
  }

  // tenant host: must match an existing league by slug (no guessing).
  const slug = resolved.slug ?? '';
  const league = leagues.find((l) => l.slug === slug);
  if (!league) return { status: 'unknown_slug', slug };
  if (!isLeagueServable(league)) {
    return {
      status: 'suspended',
      leagueId: league.id,
      slug: league.slug,
      reason: suspendedReason(league),
    };
  }
  return { status: 'ok', leagueId: league.id, slug: league.slug };
}
