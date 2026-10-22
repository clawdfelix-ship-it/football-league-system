import { DEFAULT_LEAGUE_ID } from '@/lib/tenant/config';

export type PasswordManagedAccount = {
  role: string | null | undefined;
  leagueId: number | null | undefined;
};

/**
 * Manager-password admin tools must never touch non-manager accounts, even if
 * the email belongs to the same league.
 */
export function canManageManagerPassword(
  account: PasswordManagedAccount,
  requestLeagueId: number
): boolean {
  if (requestLeagueId <= 0) return false;
  const accountLeagueId = account.leagueId ?? DEFAULT_LEAGUE_ID;
  return account.role === 'manager' && accountLeagueId === requestLeagueId;
}
