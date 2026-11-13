/**
 * Shared league-admin request guard (2026-11-13 cross-tenant authz fix).
 *
 * Centralises the authorization decision that legacy routes previously
 * re-implemented (inconsistently) on their own. A league-scoped admin
 * mutation route should call this ONCE, before any DB read or mutation,
 * and bail out with the returned Response on a non-null result.
 *
 * Behaviour (fail-closed):
 *   a) no session / no valid auth context                → 401
 *   b) session role is not 'admin'                       → 403
 *   c) league-bound admin on a different host league     → 403
 *   d) host is not a servable tenant (leagueId <= 0)     → 400 NO_TENANT
 *   e) explicit platform principal (isPlatform / lid=0)  → 403
 *
 * Why (e) is a denial: these routes (manager-accounts, team-passwords) are
 * league-scoped password-management operations. Platform admins manage
 * cross-tenant concerns through dedicated console routes guarded by
 * getPlatformAdmin(); letting an env-allow-listed email re-use a league
 * route would silently widen that email's blast radius and conflate two
 * distinct principals. Conservative: no new privilege is granted.
 *
 * League-bound sessions minted before the tenant deploy carry no leagueId.
 * getAuthContext() already confines those to DEFAULT_LEAGUE_ID, which we
 * inherit here — we do NOT treat a missing leagueId as "both sides default
 * to 1" bypass, and we never read the league from a raw Host header or from
 * the request body.
 */
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getRequestLeagueId } from '@/lib/tenant/context';
import { fail } from '@/lib/api/response';
import { DEFAULT_LEAGUE_ID } from '@/lib/tenant/config';

export type LeagueAdminAuth = {
  email: string | null;
  username: string | null;
  /** The host's (== session's) league id. Always > 0 here. */
  leagueId: number;
};

type RawUser = {
  role?: unknown;
  email?: unknown;
  username?: unknown;
  name?: unknown;
  leagueId?: unknown;
  isPlatform?: unknown;
};

/**
 * Returns { auth, leagueId } when the request is authorized as a
 * league-bound admin for the current host; otherwise returns a Response
 * describing the denial. Usage:
 *
 *   const guard = await requireLeagueAdmin();
 *   if (guard instanceof Response) return guard;
 *   // guard.leagueId is the tenant-scoped id for all downstream queries.
 */
export async function requireLeagueAdmin(): Promise<
  (LeagueAdminAuth & { actor: { role: 'admin'; email: string | null; username: string | null } }) | Response
> {
  const session = await getServerSession(authOptions);
  const user = (session?.user as RawUser | undefined) ?? null;
  if (!user) {
    return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
  }
  if (user.role !== 'admin') {
    return fail(403, 'FORBIDDEN', 'Admin access required');
  }

  // Explicit platform principals are rejected from league-scoped routes.
  const isPlatform = user.isPlatform === true || user.leagueId === 0;
  if (isPlatform) {
    return fail(403, 'FORBIDDEN', 'Platform principals cannot operate league-scoped admin routes');
  }

  const hostLid = await getRequestLeagueId();
  if (hostLid <= 0) {
    return fail(400, 'NO_TENANT', 'No active league on this host');
  }

  // Legacy tokens (no leagueId) are confined to the founding league by
  // getAuthContext()'s rule; mirror it here so a missing leagueId never
  // silently matches an arbitrary host. If host is not the default league,
  // an unscoped session is a mismatch → denied.
  const sessionLid =
    typeof user.leagueId === 'number' && user.leagueId > 0 ? user.leagueId : DEFAULT_LEAGUE_ID;

  if (sessionLid !== hostLid) {
    return fail(403, 'FORBIDDEN', 'Cross-league access denied');
  }

  const email = typeof user.email === 'string' ? user.email : null;
  const username =
    typeof user.username === 'string' ? user.username :
    typeof user.name === 'string' ? user.name : null;

  return {
    email,
    username,
    leagueId: hostLid,
    actor: { role: 'admin' as const, email, username },
  };
}
