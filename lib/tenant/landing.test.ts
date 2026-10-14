import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers and the DB-backed directory before importing the unit
// under test. getRequestTenant() reads the trusted headers that middleware
// injects.
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('./leagues', () => ({
  listLeagueDirectory: vi.fn().mockResolvedValue([]),
}));

import { headers } from 'next/headers';
import { getRequestTenant } from './context';
import { shouldRenderPlatformLanding } from './landing';
import {
  TENANT_KIND_HEADER,
  TENANT_HOST_HEADER,
  TENANT_SLUG_HEADER,
} from './headers';

const mockHeaders = vi.mocked(headers);

function stubTenantHeaders(init: Record<string, string>) {
  const h = new Map<string, string>(Object.entries(init));
  mockHeaders.mockResolvedValue({
    get: (name: string) => h.get(name.toLowerCase()) ?? null,
  } as unknown as Awaited<ReturnType<typeof headers>>);
}

beforeEach(() => {
  mockHeaders.mockReset();
});

describe('shouldRenderPlatformLanding', () => {
  it('is true only for the platform host', () => {
    expect(shouldRenderPlatformLanding({ isPlatform: true })).toBe(true);
    expect(shouldRenderPlatformLanding({ isPlatform: false })).toBe(false);
  });
});

describe('getRequestTenant — root page host branch contract', () => {
  it('classifies platform host as platform: no league, not servable', async () => {
    stubTenantHeaders({
      [TENANT_KIND_HEADER]: 'platform',
      [TENANT_HOST_HEADER]: 'platform.zenex-sports.com',
    });
    const tenant = await getRequestTenant();
    expect(tenant.isPlatform).toBe(true);
    expect(tenant.servable).toBe(false);
    expect(tenant.notFound).toBe(false);
    expect(tenant.leagueId).toBe(0);
    expect(shouldRenderPlatformLanding(tenant)).toBe(true);
  });

  it('ignores a client-spoofed slug header on the platform host', async () => {
    // Middleware strips inbound x-zenex-* and rewrites them; if a spoofed slug
    // ever survived alongside a platform host, the platform classification and
    // leagueId 0 must hold.
    stubTenantHeaders({
      [TENANT_KIND_HEADER]: 'platform',
      [TENANT_HOST_HEADER]: 'platform.zenex-sports.com',
      [TENANT_SLUG_HEADER]: 'hkbankleague2026',
    });
    const tenant = await getRequestTenant();
    expect(tenant.isPlatform).toBe(true);
    expect(tenant.leagueId).toBe(0);
  });

  it('falls back to the founding league outside a request scope (no headers)', async () => {
    mockHeaders.mockRejectedValue(new Error('Dynamic server APIs cannot be called'));
    const tenant = await getRequestTenant();
    expect(tenant.isPlatform).toBe(false);
    expect(tenant.servable).toBe(true);
    expect(shouldRenderPlatformLanding(tenant)).toBe(false);
  });
});
