/**
 * Per-request tenant context for server components / route handlers / actions.
 *
 * Flow:
 *   middleware parses the host -> internal headers (tamper-evident)
 *   getRequestTenant() reads those headers, validates the slug against the
 *   leagues directory (cached), and returns the concrete leagueId.
 *
 * Backward compatibility: while only one league exists and pages are also
 * reached on vercel.app/localhost (kind 'default'), the result is league #1.
 * If called outside a request scope (e.g. scripts) or if the directory lookup
 * fails, it safely falls back to the founding league so the current app keeps
 * working; only an *unknown real subdomain* is reported as notFound.
 */
import { headers } from 'next/headers';
import {
  TENANT_SLUG_HEADER,
  TENANT_KIND_HEADER,
  TENANT_HOST_HEADER,
} from './headers';
import { resolveHost, type ResolvedHost } from './resolve-host';
import { mapResolvedToLeague, type TenantResolution } from './map-league';
import { listLeagueDirectory } from './leagues';
import { DEFAULT_LEAGUE_ID, DEFAULT_LEAGUE_SLUG } from './config';

export type RequestTenant = {
  resolution: TenantResolution;
  leagueId: number;
  slug: string;
  host: string;
  kind: ResolvedHost['kind'];
  /** True when this request serves a concrete league (active/trial/default). */
  servable: boolean;
  /** True only when the host is the platform console (no league). */
  isPlatform: boolean;
  /** True when slug looked like a tenant but no such league exists. */
  notFound: boolean;
};

async function resolveFromHeaders(): Promise<ResolvedHost | null> {
  try {
    const h = await headers();
    const kind = h.get(TENANT_KIND_HEADER);
    const host = h.get(TENANT_HOST_HEADER);
    const slug = h.get(TENANT_SLUG_HEADER);
    // Only trust if middleware actually stamped this request.
    if (!kind || !host) return null;
    const resolved = resolveHost(host);
    if (resolved.kind !== kind || (resolved.slug ?? null) !== (slug as string | null)) {
      // Header/host mismatch — re-derive straight from the host, never trust
      // a slug header on its own.
      return resolveHost(host);
    }
    return resolved;
  } catch {
    // next/headers throws outside a request scope (scripts, tests, build).
    return null;
  }
}

export async function getRequestTenant(): Promise<RequestTenant> {
  const resolved =
    (await resolveFromHeaders()) ??
    ({
      kind: 'default',
      slug: DEFAULT_LEAGUE_SLUG,
      leagueId: DEFAULT_LEAGUE_ID,
      host: '',
    } as ResolvedHost);

  // Platform hosts carry no league yet (Phase 3 adds the console there).
  if (resolved.kind === 'platform') {
    return {
      resolution: { status: 'platform' },
      leagueId: 0,
      slug: '',
      host: resolved.host,
      kind: 'platform',
      servable: false,
      isPlatform: true,
      notFound: false,
    };
  }

  const directory = await listLeagueDirectory();
  let resolution: TenantResolution;
  if (directory.length === 0) {
    // DB unavailable during render — fail safe to the founding league rather
    // than 404 the live single-tenant site.
    resolution =
      resolved.kind === 'tenant'
        ? { status: 'unknown_slug', slug: resolved.slug ?? '' }
        : { status: 'ok', leagueId: DEFAULT_LEAGUE_ID, slug: DEFAULT_LEAGUE_SLUG };
  } else {
    resolution = mapResolvedToLeague(resolved, directory);
  }

  if (resolution.status === 'unknown_slug') {
    return {
      resolution,
      leagueId: 0,
      slug: resolution.slug,
      host: resolved.host,
      kind: resolved.kind,
      servable: false,
      isPlatform: false,
      notFound: true,
    };
  }

  if (resolution.status === 'suspended') {
    return {
      resolution,
      leagueId: resolution.leagueId,
      slug: resolution.slug,
      host: resolved.host,
      kind: resolved.kind,
      servable: false,
      isPlatform: false,
      notFound: false,
    };
  }

  // ok (platform and unknown_slug were handled earlier; narrow defensively).
  if (resolution.status !== 'ok') {
    return {
      resolution,
      leagueId: DEFAULT_LEAGUE_ID,
      slug: DEFAULT_LEAGUE_SLUG,
      host: resolved.host,
      kind: resolved.kind,
      servable: false,
      isPlatform: false,
      notFound: false,
    };
  }

  return {
    resolution,
    leagueId: resolution.leagueId,
    slug: resolution.slug,
    host: resolved.host,
    kind: resolved.kind,
    servable: true,
    isPlatform: false,
    notFound: false,
  };
}

/**
 * League id to scope a query against.
 *
 * - servable tenant (incl. default host / outside-request / single-tenant)
 *   -> its concrete league id (founding league #1 today)
 * - unknown subdomain / suspended / platform host -> 0, which matches no rows.
 *   This is deliberate defence-in-depth: a host that is not a real, servable
 *   league must never silently read league #1's data. Pages additionally call
 *   notFound()/a suspended notice via getRequestTenant() (wired in Phase 3
 *   when wildcard subdomains exist), but even a page that forgets gets 0 rows.
 */
export async function getRequestLeagueId(): Promise<number> {
  const t = await getRequestTenant();
  return t.servable ? t.leagueId : 0;
}
