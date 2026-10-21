import { TENANT_BASE_DOMAIN, PLATFORM_HOSTS } from '@/lib/tenant/config';
import { normalizeHost, resolveHost } from '@/lib/tenant/resolve-host';

const DEFAULT_APP_BASE_URL =
  'https://football-league-system-zenex.vercel.app';

function fallbackOrigin(baseUrl: string | null | undefined): string {
  return (baseUrl || DEFAULT_APP_BASE_URL).replace(/\/$/, '');
}

export function isAllowedResetHost(
  requestHost: string | null | undefined
): boolean {
  const host = normalizeHost(requestHost);
  if (!host) return false;
  if (PLATFORM_HOSTS.has(host)) return true;

  const resolved = resolveHost(host);
  return (
    resolved.kind === 'tenant' &&
    host.endsWith(`.${TENANT_BASE_DOMAIN}`) &&
    resolved.host === host
  );
}

export function buildResetUrl(
  rawToken: string,
  requestHost?: string | null,
  appBaseUrl?: string | null
): string {
  const origin = isAllowedResetHost(requestHost)
    ? `https://${normalizeHost(requestHost)}`
    : fallbackOrigin(appBaseUrl ?? process.env.APP_BASE_URL);

  return `${origin}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

export function canRedeemResetTokenOnLeague(
  tokenLeagueId: number | null | undefined,
  requestLeagueId: number
): boolean {
  return (
    Number.isInteger(requestLeagueId) &&
    requestLeagueId > 0 &&
    Number.isInteger(tokenLeagueId) &&
    tokenLeagueId === requestLeagueId
  );
}
