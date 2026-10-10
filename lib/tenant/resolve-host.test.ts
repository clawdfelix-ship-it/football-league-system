import { describe, it, expect } from 'vitest';
import { resolveHost, normalizeHost, isValidSlug } from './resolve-host';

describe('normalizeHost', () => {
  it('lowercases, strips scheme/path/port/trailing dot', () => {
    expect(normalizeHost('https://HK.League.ZENEX-SPORTS.com:3000/x?y=1')).toBe(
      'hk.league.zenex-sports.com'
    );
    expect(normalizeHost('zenex-sports.com.')).toBe('zenex-sports.com');
    expect(normalizeHost(null)).toBe('');
  });
});

describe('isValidSlug', () => {
  it('accepts simple slugs', () => {
    expect(isValidSlug('hkbankleague2026')).toBe(true);
    expect(isValidSlug('a')).toBe(true);
    expect(isValidSlug('my-league-2')).toBe(true);
  });
  it('rejects bad slugs', () => {
    expect(isValidSlug('-x')).toBe(false);
    expect(isValidSlug('x-')).toBe(false);
    expect(isValidSlug('a--b')).toBe(false);
    expect(isValidSlug('a b')).toBe(false);
    expect(isValidSlug('UPPER')).toBe(false);
    expect(isValidSlug('')).toBe(false);
    expect(isValidSlug(null)).toBe(false);
  });
});

describe('resolveHost', () => {
  it('treats apex/www/admin as platform', () => {
    for (const h of [
      'zenex-sports.com',
      'www.zenex-sports.com',
      'admin.zenex-sports.com',
      'platform.zenex-sports.com',
    ]) {
      const r = resolveHost(h);
      expect(r.kind).toBe('platform');
      expect(r.slug).toBeNull();
      expect(r.leagueId).toBeNull();
    }
  });

  it('resolves a single-label subdomain as a tenant slug', () => {
    const r = resolveHost('hkbankleague2026.zenex-sports.com');
    expect(r.kind).toBe('tenant');
    expect(r.slug).toBe('hkbankleague2026');
  });

  it('rejects multi-label / malformed subdomains as platform (no guessing)', () => {
    expect(resolveHost('a.b.zenex-sports.com').kind).toBe('platform');
    expect(resolveHost('-bad.zenex-sports.com').kind).toBe('platform');
  });

  it('falls back to the default founding league for vercel/localhost/unknown', () => {
    for (const h of [
      'football-league-system-zenex-q7i1xlh4d-clawdfelix.vercel.app',
      'localhost',
      'localhost:3000',
      '127.0.0.1:3000',
      'some-other-domain.com',
    ]) {
      const r = resolveHost(h);
      expect(r.kind).toBe('default');
      expect(r.slug).toBe('hkbankleague2026');
      expect(r.leagueId).toBe(1);
    }
  });

  it('normalizes scheme and port on a tenant host', () => {
    const r = resolveHost('https://HKBankLeague2026.zenex-sports.com:443/');
    expect(r.kind).toBe('tenant');
    expect(r.slug).toBe('hkbankleague2026');
  });
});
