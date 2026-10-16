/**
 * Tenant / platform host configuration (edge-safe: no fs/db/next imports).
 *
 * Overridable via env so preview/local work without code changes:
 *   TENANT_BASE_DOMAIN   apex domain that carries per-league subdomains
 *   PLATFORM_HOSTS       comma-separated extra hostnames for the platform console
 *   DEFAULT_LEAGUE_SLUG  slug used for legacy/unknown/preview hosts (tenant #1)
 *   NEXT_PUBLIC_PLATFORM_URL  public origin of the SaaS console (client-safe)
 *
 * DNS reality (2026-10): the apex and www.zenex-sports.com point at Shopify,
 * NOT Vercel. The SaaS platform console lives on the dedicated
 * `platform.` subdomain. apex/www stay in PLATFORM_HOSTS only as a defensive
 * classification (if such a request ever reached Vercel it must render the
 * platform shell, never leak tenant #1's data), but no public link may target
 * the apex — outbound URLs always use PLATFORM_PUBLIC_URL.
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
    // Defensive only (see file header): apex/www are Shopify in production DNS.
    TENANT_BASE_DOMAIN,
    `www.${TENANT_BASE_DOMAIN}`,
    `admin.${TENANT_BASE_DOMAIN}`,
    `platform.${TENANT_BASE_DOMAIN}`,
    ...extraPlatform,
  ].filter(Boolean)
);

/**
 * Public origin of the SaaS platform (console + self-serve application).
 * NEXT_PUBLIC_* is inlined into client components by Next; the default works
 * with zero env in both server and browser bundles.
 */
const clientPlatformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL?.trim().replace(/\/+$/, '');
export const PLATFORM_PUBLIC_URL =
  clientPlatformUrl || `https://platform.${TENANT_BASE_DOMAIN}`;

/** Host-only form, e.g. platform.zenex-sports.com (derived from the URL). */
export const PLATFORM_PUBLIC_HOST = PLATFORM_PUBLIC_URL.replace(/^https?:\/\//, '');

/** Public self-serve league application page on the platform host. */
export const PLATFORM_APPLY_URL = `${PLATFORM_PUBLIC_URL}/apply`;

export const DEFAULT_LEAGUE_SLUG = (
  process.env.DEFAULT_LEAGUE_SLUG || 'hkbankleague2026'
)
  .trim()
  .toLowerCase();

export const DEFAULT_LEAGUE_ID = Number(process.env.DEFAULT_LEAGUE_ID ?? '1') || 1;

/**
 * Default trial window (days) stamped on a newly provisioned league.
 * Overridable via TRIAL_DAYS; 0 or a negative value means an open-ended trial
 * (trial_ends_at left NULL — only sensible for internal/manual provisioning).
 */
export const TRIAL_DAYS = Number(process.env.TRIAL_DAYS ?? '14') || 0;

/** Compute the trial end timestamp for a league provisioned at `from`. */
export function trialEndsFrom(from: Date = new Date(), days: number = TRIAL_DAYS): Date | null {
  if (!Number.isFinite(days) || days <= 0) return null;
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}
