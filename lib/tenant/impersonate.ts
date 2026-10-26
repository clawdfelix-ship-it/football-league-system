import { tenantHostname } from './vercel-tls';

export function buildImpersonateUrl(slug: string, token: string): string {
  return `https://${tenantHostname(slug)}/auth/impersonate#token=${encodeURIComponent(token)}`;
}

export function extractImpersonateToken(input: {
  hash?: string | null;
  search?: string | null;
}): string {
  const hashToken = new URLSearchParams((input.hash || '').replace(/^#/, '')).get('token');
  if (hashToken) return hashToken;
  return new URLSearchParams((input.search || '').replace(/^\?/, '')).get('token') || '';
}
