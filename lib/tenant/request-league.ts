import { resolveLeagueIdForHost } from './resolve-league.server';

type RequestLike = {
  url?: string;
  headers: {
    get(name: string): string | null;
  };
};

/**
 * Resolve the concrete league directly from the inbound request Host header.
 *
 * This is required for handlers under `/api/auth`, which are intentionally
 * excluded from the middleware matcher and therefore do not receive the
 * trusted x-zenex-* tenant headers.
 */
export async function resolveLeagueIdForRequest(request: RequestLike): Promise<number> {
  const headerHost = request.headers.get('host');
  const urlHost =
    !headerHost && request.url
      ? new URL(request.url).host
      : null;
  return resolveLeagueIdForHost(headerHost ?? urlHost);
}
