/**
 * Pure host → tenant resolution (edge-safe: no fs/db/next imports).
 *
 * Given a request hostname it decides:
 *   - is this the PLATFORM console (apex/www/admin) → no league slug
 *   - or a TENANT subdomain `{slug}.zenex-sports.com`
 *   - or an unknown/preview/localhost host → fall back to the default league
 *     so the existing single-tenant deployment keeps working until Phase 3
 *
 * This module does NO DB access; it only derives a candidate slug. The server
 * layer validates the slug against the `leagues` table and maps it to an id.
 */
import {
  TENANT_BASE_DOMAIN,
  PLATFORM_HOSTS,
  DEFAULT_LEAGUE_SLUG,
  DEFAULT_LEAGUE_ID,
} from './config';

export type HostKind = 'platform' | 'tenant' | 'default';

export type ResolvedHost = {
  kind: HostKind;
  /** League slug for tenant/default hosts; null on the platform console. */
  slug: string | null;
  /** Best-effort league id; only authoritative after DB validation. */
  leagueId: number | null;
  /** Normalised lowercased hostname that was parsed (no port). */
  host: string;
};

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;

export function normalizeHost(host: string | null | undefined): string {
  return (host ?? '')
    .toLowerCase()
    .trim()
    .replace(/^[a-z]+:\/\//, '') // strip scheme if a URL sneaks in
    .split('/')[0] // drop any path
    .split(':')[0] // drop port
    .replace(/\.$/, ''); // trailing dot
}

export function isValidSlug(slug: string | null | undefined): slug is string {
  return Boolean(slug && SLUG_RE.test(slug) && !slug.includes('--'));
}

export function resolveHost(rawHost: string | null | undefined): ResolvedHost {
  const host = normalizeHost(rawHost);

  // Explicit platform hosts (apex, www, admin, configured extras).
  if (host && PLATFORM_HOSTS.has(host)) {
    return { kind: 'platform', slug: null, leagueId: null, host };
  }

  // Tenant subdomain under the base apex, e.g. hkbankleague2026.zenex-sports.com.
  const suffix = `.${TENANT_BASE_DOMAIN}`;
  if (host.endsWith(suffix)) {
    const label = host.slice(0, -suffix.length);
    // Only a single left-most label is a tenant slug; a.b.zenex-sports.com is not.
    if (label && !label.includes('.') && isValidSlug(label)) {
      return { kind: 'tenant', slug: label, leagueId: null, host };
    }
    // malformed subdomain → treat as platform landing rather than guessing
    return { kind: 'platform', slug: null, leagueId: null, host };
  }

  // Everything else (vercel.app previews, localhost, unknown domain) serves
  // the default founding league so existing links deployments keep working.
  return {
    kind: 'default',
    slug: DEFAULT_LEAGUE_SLUG,
    leagueId: DEFAULT_LEAGUE_ID,
    host,
  };
}
