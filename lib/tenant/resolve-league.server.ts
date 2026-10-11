/**
 * Resolve the concrete league id for an arbitrary HOST string (Node runtime).
 *
 * Unlike getRequestLeagueId() this does NOT rely on next/headers or the
 * middleware-stamped x-zenex-* headers: the NextAuth credentials callback runs
 * under /api/auth, which the middleware matcher deliberately excludes, so the
 * only trustworthy tenant signal there is the raw request Host.
 *
 * Returns:
 *   >0  a concrete, servable league for this host
 *   0   platform/unknown host that must never map to league data
 */
import { resolveHost } from './resolve-host';
import { listLeagueDirectory } from './leagues';
import { DEFAULT_LEAGUE_ID } from './config';

export async function resolveLeagueIdForHost(
  rawHost: string | null | undefined
): Promise<number> {
  const resolved = resolveHost(rawHost);

  if (resolved.kind === 'platform') return 0;

  const directory = await listLeagueDirectory();

  if (resolved.kind === 'default') {
    // vercel.app / localhost / unknown apex -> founding league, unless the
    // directory says that league is suspended.
    if (directory.length === 0) return DEFAULT_LEAGUE_ID;
    const founding = directory.find((l) => l.id === DEFAULT_LEAGUE_ID);
    if (!founding) return DEFAULT_LEAGUE_ID;
    return founding.status === 'active' || founding.status === 'trial'
      ? founding.id
      : 0;
  }

  // tenant subdomain: exact slug match only, and it must be servable.
  const slug = resolved.slug ?? '';
  const league = directory.find((l) => l.slug === slug);
  if (!league) return 0;
  return league.status === 'active' || league.status === 'trial' ? league.id : 0;
}
