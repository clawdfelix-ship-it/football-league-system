/**
 * Tenant / platform host configuration (edge-safe: no fs/db/next imports).
 *
 * Overridable via env so preview/local work without code changes:
 *   TENANT_BASE_DOMAIN   apex domain that carries per-league subdomains
 *   PLATFORM_HOSTS       comma-separated extra hostnames for the platform console
 *   DEFAULT_LEAGUE_SLUG  slug used for legacy/unknown/preview hosts (tenant #1)
 *
 * Until provisioning (Phase 3) creates more leagues, every host that is not
 * the platform console resolves to the single founding league — this keeps
 * the existing vercel.app deployment and all current links working unchanged.
 */

export const TENANT_BASE_DOMAIN = (
  process.env.TENANT_BASE_DOMAIN || 'zenex-sports.com'
)
  .trim()
  .toLowerCase();

const extraPlatform = (process.env.PLATFORM_HOSTS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const PLATFORM_HOSTS: ReadonlySet<string> = new Set(
  [
    TENANT_BASE_DOMAIN,
    `www.${TENANT_BASE_DOMAIN}`,
    `admin.${TENANT_BASE_DOMAIN}`,
    'platform.zenex-sports.com',
    ...extraPlatform,
  ].filter(Boolean)
);

export const DEFAULT_LEAGUE_SLUG = (
  process.env.DEFAULT_LEAGUE_SLUG || 'hkbankleague2026'
)
  .trim()
  .toLowerCase();

export const DEFAULT_LEAGUE_ID = Number(process.env.DEFAULT_LEAGUE_ID ?? '1') || 1;
