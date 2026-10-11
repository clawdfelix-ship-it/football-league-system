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
