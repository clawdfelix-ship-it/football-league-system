import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { TEAMS } from '@/lib/constants';
import { ROLES, normalizeRole, type Role } from '@/lib/auth/roles';
import { isPlatformAdminEmail } from '@/lib/tenant/platform-admin';
import { getRequestLeagueId } from '@/lib/tenant/context';
import { DEFAULT_LEAGUE_ID } from '@/lib/tenant/config';
import { getTeamNameFromDbId, resolveManagerTeamDbId } from '@/lib/tenant/team-auth.server';

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
    leagueId?: unknown;
    isPlatform?: unknown;
  } | null;

  const role = normalizeRole(user?.role);
  if (!role) return null;
  // AuthContext exposes only admin/manager; 'user' is treated as unauthenticated
  // for mutation scopes (consistent with existing route guards).
  if (role !== ROLES.ADMIN && role !== ROLES.MANAGER) return null;

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

  // ---- Team identity migration (Phase B) ----
  // Convert array-index teamId to DB id when possible.
  let resolvedTeamId = typeof user?.teamId === 'number' ? user.teamId : undefined;
  if (role === ROLES.MANAGER && resolvedTeamId !== undefined && user?.email) {
    // Check if this is a legacy array index by seeing if the user already has team_id set
    const dbTeamId = await resolveManagerTeamDbId(user.email as string);
    if (dbTeamId !== null && dbTeamId !== resolvedTeamId) {
      // Session holds array index; upgrade to DB id
      resolvedTeamId = dbTeamId;
    }
  }

  return {
    role,
    teamId: resolvedTeamId,
    username:
      (typeof user?.username === 'string' ? user.username : undefined) ??
      (typeof user?.name === 'string' ? user.name : undefined),
    email: typeof user?.email === 'string' ? user.email : undefined,
    leagueId: isPlatform ? 0 : sessionLid,
    isPlatform,
  };
}

export async function getTeamNameFromTeamId(teamId: number | undefined): Promise<string | null> {
  if (teamId === undefined) return null;
  // First try DB id lookup (source of truth)
  const dbName = await getTeamNameFromDbId(teamId);
  if (dbName) return dbName;
  // Fallback: legacy array index (for sessions that haven't been upgraded)
  const team = TEAMS[teamId];
  if (!team) return null;
  if (team.name === 'DEMO') return null;
  return team.name;
}

/**
 * Async version: resolves DB id to team name. Use this for new code.
 */
export async function getTeamNameFromDbIdAsync(teamId: number | undefined): Promise<string | null> {
  if (teamId === undefined) return null;
  return getTeamNameFromDbId(teamId);
}

type PlatformSessionUser = {
  role?: unknown;
  leagueId?: unknown;
  isPlatform?: unknown;
};

export function hasPlatformPrincipalClaims(user: PlatformSessionUser | null | undefined): boolean {
  return (
    user?.role === ROLES.ADMIN &&
    (user?.isPlatform === true || user?.leagueId === 0)
  );
}

/**
 * Platform-admin guard for the SaaS console / provisioning routes. Unlike the
 * league-scoped getAuthContext() (an 'admin' who manages ONE league), this
 * checks the signed-in user's email against PLATFORM_ADMIN_EMAILS. Returns the
 * platform admin's email, or null (unauthenticated / not allow-listed).
 */
export async function getPlatformAdmin(): Promise<{ email: string; userId: number | null } | null> {
  const session = await getServerSession(authOptions);
  const user = (session?.user as ({
    email?: unknown;
  } & PlatformSessionUser) | null);
  if (!hasPlatformPrincipalClaims(user)) return null;
  const email = user?.email;
  if (typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();

  // 1. Env allow-list (bootstrap / break-glass)
  if (isPlatformAdminEmail(normalized)) {
    return { email: normalized, userId: null };
  }

  // 2. DB allow-list (runtime-managed via console UI)
  try {
    const { db } = await import('@/lib/db');
    const { platformAdmins } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');
    const [row] = await db
      .select({ id: platformAdmins.id })
      .from(platformAdmins)
      .where(eq(platformAdmins.email, normalized))
      .limit(1);
    if (row) return { email: normalized, userId: null };
  } catch (e) {
    // DB failure must not lock out env-based admins; just deny DB-only entries.
    console.error('[authz] platform_admins lookup failed:', e);
  }

  return null;
}
