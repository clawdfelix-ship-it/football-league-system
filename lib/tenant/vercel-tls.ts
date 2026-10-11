/**
 * Vercel per-tenant TLS provisioning.
 *
 * WHY THIS EXISTS (2026-10-11):
 * zenex-sports.com keeps its nameservers at GoDaddy (it also serves a Shopify
 * store + Zoho mail on apex/www), so Vercel CANNOT issue a wildcard cert
 * `*.zenex-sports.com` — the API returns 449 dns_pretest_cns_not_using_vercel_ns.
 * Vercel also does NOT auto-issue a cert for a brand-new subdomain on first
 * TLS hit when DNS is external (the handshake fails until a cert exists).
 *
 * The working pattern under external DNS + a CNAME wildcard is to request a
 * single-host cert per tenant via the Vercel API. It validates over HTTP-01
 * (the wildcard CNAME already points the host at Vercel), issues in seconds,
 * and auto-renews. Call this right after a league is provisioned.
 *
 * The Vercel token is a team API token (starts `vercel_` or an OAuth `vca_`
 * token). Only needed in production; without it provisioning still succeeds
 * and TLS is simply issued later / manually.
 */
import { TENANT_BASE_DOMAIN } from './config';

export function tenantHostname(slug: string, baseDomain: string = TENANT_BASE_DOMAIN): string {
  const s = slug.trim().toLowerCase();
  const b = baseDomain.trim().toLowerCase().replace(/\.$/, '');
  return `${s}.${b}`;
}

export type CertResult =
  | { ok: true; cns: string[] }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped: false; status: number; error: string };

/**
 * Ask Vercel to issue (or reuse) a cert for the tenant hostname.
 * Best-effort: never throws — a TLS hiccup must not fail league provisioning.
 *
 * @param fetchImpl injectable for tests; defaults to global fetch.
 */
export async function ensureTenantCert(
  slug: string,
  opts: {
    token?: string;
    teamId?: string;
    baseDomain?: string;
    fetchImpl?: typeof fetch;
  } = {}
): Promise<CertResult> {
  const token = opts.token ?? process.env.VERCEL_TOKEN ?? process.env.VERCEL_ACCESS_TOKEN;
  const teamId = opts.teamId ?? process.env.VERCEL_TEAM_ID;
  if (!token) return { ok: false, skipped: true, reason: 'no VERCEL_TOKEN' };

  const cn = tenantHostname(slug, opts.baseDomain);
  const f = opts.fetchImpl ?? fetch;
  const url = new URL('https://api.vercel.com/v5/certs');
  if (teamId) url.searchParams.set('teamId', teamId);

  try {
    const res = await f(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domains: [cn] }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      cns?: string[];
      error?: { code?: string; message?: string };
    };
    if (!res.ok) {
      // A cert already existing is fine — Vercel may 409/400 on duplicate.
      const code = data.error?.code ?? `http_${res.status}`;
      if (/already|conflict|exist/i.test(code)) {
        return { ok: true, cns: data.cns ?? [cn] };
      }
      return { ok: false, skipped: false, status: res.status, error: code };
    }
    return { ok: true, cns: data.cns ?? [cn] };
  } catch (e) {
    return {
      ok: false,
      skipped: false,
      status: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
