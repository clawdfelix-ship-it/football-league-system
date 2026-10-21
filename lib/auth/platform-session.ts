import { ROLES, normalizeRole } from '@/lib/auth/roles';
import { isPlatformAdminEmail } from '@/lib/tenant/platform-admin';

export type PlatformAdminSessionUser = {
  email?: unknown;
  role?: unknown;
  leagueId?: unknown;
  isPlatform?: unknown;
} | null;

export function getValidatedPlatformAdminEmail(
  user: PlatformAdminSessionUser
): string | null {
  const email = typeof user?.email === 'string' ? user.email.trim().toLowerCase() : '';
  if (!email || !isPlatformAdminEmail(email)) return null;

  const role = normalizeRole(user?.role);
  if (role !== ROLES.ADMIN) return null;

  const isPlatform = user?.isPlatform === true || user?.leagueId === 0;
  if (!isPlatform) return null;

  return email;
}
