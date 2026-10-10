import { describe, it, expect } from 'vitest';
import {
  buildTenantRequestHeaders,
  TENANT_SLUG_HEADER,
  TENANT_KIND_HEADER,
  TENANT_HOST_HEADER,
} from './headers';

describe('buildTenantRequestHeaders', () => {
  it('overwrites spoofed inbound tenant headers with resolved values', () => {
    const incoming = new Headers();
    incoming.set(TENANT_SLUG_HEADER, 'victim-league');
    incoming.set(TENANT_KIND_HEADER, 'tenant');
    incoming.set('x-other', 'keep');

    const h = buildTenantRequestHeaders(
      { kind: 'tenant', slug: 'hkbankleague2026', leagueId: null, host: 'hkbankleague2026.zenex-sports.com' },
      incoming
    );

    expect(h.get(TENANT_SLUG_HEADER)).toBe('hkbankleague2026');
    expect(h.get(TENANT_KIND_HEADER)).toBe('tenant');
    expect(h.get(TENANT_HOST_HEADER)).toBe('hkbankleague2026.zenex-sports.com');
    expect(h.get('x-other')).toBe('keep'); // unrelated header preserved
  });

  it('omits slug header on platform hosts', () => {
    const h = buildTenantRequestHeaders({
      kind: 'platform',
      slug: null,
      leagueId: null,
      host: 'zenex-sports.com',
    });
    expect(h.get(TENANT_SLUG_HEADER)).toBeNull();
    expect(h.get(TENANT_KIND_HEADER)).toBe('platform');
  });
});
