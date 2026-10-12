/**
 * Client-safe platform URLs.
 *
 * Client components ('use client') must not read non-NEXT_PUBLIC env vars and
 * should not import server-only tenant config. This module derives the public
 * platform origin from NEXT_PUBLIC_PLATFORM_URL (default platform.zenex-sports.com).
 *
 * Why absolute: the apex/www hosts point at Shopify, not Vercel, and the
 * self-serve application page only exists on the dedicated platform host.
 * Tenant sites link OUT to the platform rather than serving /apply locally.
 */
const RAW = process.env.NEXT_PUBLIC_PLATFORM_URL?.trim().replace(/\/+$/, '');
const BASE_DOMAIN = (
  process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN || 'zenex-sports.com'
)
  .trim()
  .toLowerCase();

export const PLATFORM_URL = RAW || `https://platform.${BASE_DOMAIN}`;
export const PLATFORM_APPLY_URL = `${PLATFORM_URL}/apply`;
export const PLATFORM_CONSOLE_URL = `${PLATFORM_URL}/platform`;
