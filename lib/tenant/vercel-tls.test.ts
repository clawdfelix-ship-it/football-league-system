import { describe, it, expect, vi, afterEach } from 'vitest';
import { tenantHostname, ensureTenantCert } from './vercel-tls';

afterEach(() => {
  delete process.env.VERCEL_TOKEN;
  delete process.env.VERCEL_TEAM_ID;
  vi.unstubAllEnvs?.();
});

describe('tenantHostname', () => {
  it('builds slug.baseDomain', () => {
    expect(tenantHostname('acme-cup', 'zenex-sports.com')).toBe(
      'acme-cup.zenex-sports.com'
    );
  });

  it('normalises case, whitespace and trailing dot', () => {
    expect(tenantHostname('  Acme-Cup ', 'Zenex-Sports.com.')).toBe(
      'acme-cup.zenex-sports.com'
    );
  });
});

describe('ensureTenantCert', () => {
  it('skips gracefully when no token is configured', async () => {
    const r = await ensureTenantCert('acme-cup');
    expect(r).toMatchObject({ ok: false, skipped: true, reason: 'no VERCEL_TOKEN' });
  });

  it('POSTs the tenant CN to /v5/certs and returns cns on 200', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ cns: ['acme-cup.zenex-sports.com'] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const r = await ensureTenantCert('acme-cup', {
      token: 't',
      teamId: 'team_1',
      fetchImpl,
    });
    expect(r).toEqual({ ok: true, cns: ['acme-cup.zenex-sports.com'] });
    const call = fetchImpl.mock.calls[0]!;
    const url = call[0] as URL;
    const init = call[1] as RequestInit;
    expect(String(url)).toContain('/v5/certs');
    expect(String(url)).toContain('teamId=team_1');
    expect(init).toMatchObject({ method: 'POST' });
    expect(JSON.parse(init.body as string)).toEqual({
      domains: ['acme-cup.zenex-sports.com'],
    });
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t');
  });

  it('treats an already-existing cert error as success (idempotent)', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({ error: { code: 'cert_already_exists', message: 'dup' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    );
    const r = await ensureTenantCert('x', { token: 't', fetchImpl });
    expect(r.ok).toBe(true);
  });

  it('returns a typed failure on a real API error without throwing', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({ error: { code: 'forbidden', message: 'nope' } }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    );
    const r = await ensureTenantCert('x', { token: 't', fetchImpl });
    expect(r).toMatchObject({ ok: false, skipped: false, status: 403, error: 'forbidden' });
  });

  it('swallows network exceptions (never breaks provisioning)', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('socket hang up');
    });
    const r = await ensureTenantCert('x', { token: 't', fetchImpl });
    expect(r).toMatchObject({ ok: false, skipped: false, status: 0 });
  });
});
