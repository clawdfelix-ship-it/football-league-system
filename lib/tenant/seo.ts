import "server-only";

import { headers } from "next/headers";
import { getRequestTenant } from "./context";
import { resolveHost } from "./resolve-host";
import { getLeagueById } from "./leagues";
import { PLATFORM_PUBLIC_URL } from "./config";

export type SeoTenant = {
  kind: "platform" | "tenant" | "default";
  /** Fully qualified https origin for the current request host. */
  origin: string;
  /** Canonical public host (no trailing slash). */
  host: string;
  slug: string | null;
  /** League display name when a servable tenant/default league resolves. */
  leagueName: string | null;
  leagueId: number | null;
  isPlatform: boolean;
};

/**
 * Resolve SEO context for the current request.
 *
 * Canonical host strategy:
 *  - platform console -> PLATFORM_PUBLIC_URL (platform.zenex-sports.com)
 *  - tenant/default   -> https://<request host>  (the subdomain is the brand;
 *                         preview/vercel hosts self-canonicalise)
 *
 * Server components / route handlers only (uses next/headers and DB). Never
 * import from middleware.
 */
export async function getSeoTenant(): Promise<SeoTenant> {
  const h = await headers();
  const hostHeader = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const parsed = resolveHost(hostHeader);
  const platformHost = PLATFORM_PUBLIC_URL.replace(/^https?:\/\//, "");
  const host = parsed.host || platformHost;
  const origin = `https://${host}`;

  const tenant = await getRequestTenant();

  let leagueName: string | null = null;
  let leagueId: number | null = null;

  if (!tenant.isPlatform && tenant.servable && tenant.leagueId) {
    leagueId = tenant.leagueId;
    try {
      const league = await getLeagueById(tenant.leagueId);
      leagueName = league?.name ?? null;
    } catch {
      leagueName = null;
    }
  }

  return {
    kind: tenant.kind,
    origin,
    host,
    slug: tenant.slug,
    leagueName,
    leagueId,
    isPlatform: tenant.isPlatform,
  };
}

export function absoluteUrl(seo: SeoTenant, path = ""): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${seo.origin}${clean === "/" ? "" : clean}`;
}
