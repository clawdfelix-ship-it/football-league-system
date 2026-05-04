import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { TEAMS } from '@/lib/constants';

export type Role = 'admin' | 'manager';

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

  const roleRaw = user?.role;
  const role: Role | null = roleRaw === 'admin' || roleRaw === 'manager' ? roleRaw : null;
  if (!role) return null;

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
