import { PLATFORM_PUBLIC_URL } from './config';
import { resolveHost, normalizeHost } from './resolve-host';

function normalizeOrigin(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

/**
 * Return a public origin that is safe to echo into outbound links.
 *
 * Trust only:
 * - the configured fallback origin itself
 * - real platform/tenant hosts under the managed base domain
 *
 * Everything else falls back to the configured canonical origin so a forged
 * Host header cannot exfiltrate one-time links to an attacker-controlled site.
 */
export function getTrustedPublicOrigin(
  requestHost: string | null | undefined,
  fallbackUrl: string | null | undefined = process.env.APP_BASE_URL || PLATFORM_PUBLIC_URL
): string {
  const fallbackOrigin = normalizeOrigin(fallbackUrl) ?? PLATFORM_PUBLIC_URL;
  const fallbackHost = normalizeHost(fallbackOrigin);
  const host = normalizeHost((requestHost ?? '').split(',')[0]);

  if (!host) return fallbackOrigin;

  if (fallbackHost && host === fallbackHost) {
    return fallbackOrigin;
  }

  const resolved = resolveHost(host);
  if (resolved.kind === 'tenant' || resolved.kind === 'platform') {
    return `https://${resolved.host}`;
  }

  return fallbackOrigin;
}
