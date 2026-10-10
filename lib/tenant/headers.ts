/**
 * Internal request headers that carry the resolved tenant from middleware to
 * server components / route handlers / server actions.
 *
 * Edge-safe: pure constants + a pure helper, no db/fs/next imports.
 *
 * SECURITY: these names carry the `x-zenex-` prefix and middleware ALWAYS
 * overwrites them from the host it parsed, so a client cannot spoof another
 * league by sending the header directly. Server code must trust these headers
 * only because middleware re-sets them on every matched request.
 */
import type { ResolvedHost } from './resolve-host';

export const TENANT_SLUG_HEADER = 'x-zenex-league-slug';
export const TENANT_KIND_HEADER = 'x-zenex-host-kind';
export const TENANT_HOST_HEADER = 'x-zenex-host';

const INTERNAL_HEADERS = [TENANT_SLUG_HEADER, TENANT_KIND_HEADER, TENANT_HOST_HEADER];

/**
 * Returns a new Headers instance with any client-supplied internal headers
 * stripped and then replaced by the middleware-resolved values. This is what
 * makes the tenant headers tamper-evident: spoofed inbound values are removed
 * before the trusted ones are written.
 */
export function buildTenantRequestHeaders(
  resolved: ResolvedHost,
  incoming?: Headers
): Headers {
  const h = new Headers(incoming ?? undefined);
  for (const name of INTERNAL_HEADERS) {
    h.delete(name);
  }
  if (resolved.slug) h.set(TENANT_SLUG_HEADER, resolved.slug);
  h.set(TENANT_KIND_HEADER, resolved.kind);
  h.set(TENANT_HOST_HEADER, resolved.host);
  return h;
}
