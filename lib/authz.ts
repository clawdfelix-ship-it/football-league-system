import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { TEAMS } from '@/lib/constants';
import { ROLES, normalizeRole, type Role } from '@/lib/auth/roles';
import { isPlatformAdminEmail } from '@/lib/tenant/platform-admin';
import { getRequestLeagueId } from '@/lib/tenant/context';
import { DEFAULT_LEAGUE_ID } from '@/lib/tenant/config';

export type { Role } from '@/lib/auth/roles';

export type AuthContext = {
  role: Role;
  teamId?: number;
  username?: string;
  email?: string;
  /** >0 = bound league; 0 = platform-wide principal. */
  leagueId?: number;
  isPlatform?: boolean;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as unknown as {
    role?: unknown;
    teamId?: unknown;
    username?: unknown;
    name?: unknown;
    email?: unknown;
    mustChangePassword?: unknown;
    leagueId?: unknown;
    isPlatform?: unknown;
  } | null;

  const role = normalizeRole(user?.role);
  if (!role) return null;
  // AuthContext exposes only admin/manager; 'user' is treated as unauthenticated
  // for mutation scopes (consistent with existing route guards).
  if (role !== ROLES.ADMIN && role !== ROLES.MANAGER) return null;
  if (user?.mustChangePassword === true) {
    return null;
  }

  // ---- Host/tenant binding (Phase 5) ----
  // Platform principals (env super admin / allow-listed platform admin) carry
  // leagueId 0 / isPlatform and may operate on any league host. A league-bound
  // session must match the host's league. Legacy tokens minted before this
  // deploy have no leagueId: confine them to the founding league so they can
  // never reach a newly provisioned tenant.
  const hostLid = await getRequestLeagueId();
  const isPlatform = user?.isPlatform === true || user?.leagueId === 0;
  const sessionLid =
    typeof user?.leagueId === 'number' && user.leagueId > 0
      ? user.leagueId
      : DEFAULT_LEAGUE_ID;

  if (!isPlatform && sessionLid !== hostLid) {
    console.warn(
      `[authz] host/session league mismatch (host=${hostLid}, session=${sessionLid}); denying.`
    );
    return null;
  }

  return {
    role,
    teamId: typeof user?.teamId === 'number' ? user.teamId : undefined,
    username:
      (typeof user?.username === 'string' ? user.username : undefined) ??
      (typeof user?.name === 'string' ? user.name : undefined),
    email: typeof user?.email === 'string' ? user.email : undefined,
    leagueId: isPlatform ? 0 : sessionLid,
    isPlatform,
  };
}

export function getTeamNameFromTeamId(teamId: number | undefined): string | null {
  if (teamId === undefined) return null;
  const team = TEAMS[teamId];
  if (!team) return null;
  if (team.name === 'DEMO') return null;
  return team.name;
}

/**
 * Platform-admin guard for the SaaS console / provisioning routes. Unlike the
 * league-scoped getAuthContext() (an 'admin' who manages ONE league), this
 * checks the signed-in user's email against PLATFORM_ADMIN_EMAILS. Returns the
 * platform admin's email, or null (unauthenticated / not allow-listed).
 */
export async function getPlatformAdmin(): Promise<{ email: string } | null> {
  const session = await getServerSession(authOptions);
  const email = (session?.user as { email?: unknown } | null)?.email;
  if (typeof email !== 'string' || !isPlatformAdminEmail(email)) return null;
  return { email: email.trim().toLowerCase() };
}
