import { getLeagueById } from '@/lib/tenant/leagues';
import { tenantHostname } from '@/lib/tenant/vercel-tls';

const DEFAULT_APP_BASE_URL = 'https://football-league-system-zenex.vercel.app';

function configuredAppBaseUrl(): string {
  return (process.env.APP_BASE_URL || DEFAULT_APP_BASE_URL).replace(/\/$/, '');
}

export async function getPasswordResetOrigin(leagueId: number): Promise<string> {
  if (leagueId > 0) {
    const league = await getLeagueById(leagueId);
    if (league?.slug) {
      return `https://${tenantHostname(league.slug)}`;
    }
  }

  return configuredAppBaseUrl();
}

export async function buildResetUrl(rawToken: string, leagueId: number): Promise<string> {
  const origin = await getPasswordResetOrigin(leagueId);
  return `${origin}/reset-password?token=${encodeURIComponent(rawToken)}`;
}
