import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { TEAMS } from '@/lib/constants';
import { ROLES, normalizeRole, type Role } from '@/lib/auth/roles';

export type { Role } from '@/lib/auth/roles';

export type AuthContext = {
  role: Role;
  teamId?: number;
  username?: string;
  email?: string;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as unknown as {
    role?: unknown;
    teamId?: unknown;
    username?: unknown;
    name?: unknown;
    email?: unknown;
  } | null;

  const role = normalizeRole(user?.role);
  if (!role) return null;
  // AuthContext exposes only admin/manager; 'user' is treated as unauthenticated
  // for mutation scopes (consistent with existing route guards).
  if (role !== ROLES.ADMIN && role !== ROLES.MANAGER) return null;

  return {
    role,
    teamId: typeof user?.teamId === 'number' ? user.teamId : undefined,
    username:
      (typeof user?.username === 'string' ? user.username : undefined) ??
      (typeof user?.name === 'string' ? user.name : undefined),
    email: typeof user?.email === 'string' ? user.email : undefined,
  };
}

export function getTeamNameFromTeamId(teamId: number | undefined): string | null {
  if (teamId === undefined) return null;
  const team = TEAMS[teamId];
  if (!team) return null;
  if (team.name === 'DEMO') return null;
  return team.name;
}