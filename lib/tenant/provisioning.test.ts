import { describe, it, expect } from 'vitest';
import {
  slugifyLeagueName,
  uniqueLeagueSlug,
  uniqueOwnerUsername,
  isValidLeagueSlug,
  isReservedSlug,
  isValidContactEmail,
  canTransitionApplication,
  assertApplicationTransition,
  canProvision,
} from './provisioning';

describe('slugifyLeagueName', () => {
  it('turns names into dns-safe slugs', () => {
    expect(slugifyLeagueName('HK Bank League 2026')).toBe('hk-bank-league-2026');
    expect(slugifyLeagueName('  ACME!!  Cup  ')).toBe('acme-cup');
    expect(slugifyLeagueName('Café United')).toBe('cafe-united');
  });
  it('falls back when nothing usable', () => {
    expect(slugifyLeagueName('!!!')).toBe('league');
    expect(slugifyLeagueName('')).toBe('league');
  });
  it('caps at one dns label (63 chars)', () => {
    const s = slugifyLeagueName('a'.repeat(100));
    expect(s.length).toBeLessThanOrEqual(63);
  });
});

describe('isValidLeagueSlug', () => {
  it('accepts valid, rejects invalid', () => {
    expect(isValidLeagueSlug('hk-bank-2026')).toBe(true);
    expect(isValidLeagueSlug('a')).toBe(true);
    expect(isValidLeagueSlug('-x')).toBe(false);
    expect(isValidLeagueSlug('a--b')).toBe(false);
    expect(isValidLeagueSlug('A')).toBe(false);
    expect(isValidLeagueSlug('')).toBe(false);
  });
});

describe('uniqueLeagueSlug', () => {
  it('returns base when free', () => {
    expect(uniqueLeagueSlug('ACME Cup', new Set(['other']))).toBe('acme-cup');
  });
  it('appends numeric suffix on collision and keeps probing', () => {
    const taken = new Set(['acme-cup', 'acme-cup-2']);
    expect(uniqueLeagueSlug('ACME Cup', taken)).toBe('acme-cup-3');
  });
  it('accepts an iterable', () => {
    expect(uniqueLeagueSlug('Acme', ['acme'])).toBe('acme-2');
  });
  it('stays within 63 chars even with suffix', () => {
    const long = 'x'.repeat(70);
    const s = uniqueLeagueSlug(long, new Set([slugifyOk()]));
    expect(s.length).toBeLessThanOrEqual(63);
    function slugifyOk() { return 'x'.repeat(63); }
  });
});

describe('isReservedSlug', () => {
  it('blocks platform hostnames (case/space insensitive)', () => {
    expect(isReservedSlug('admin')).toBe(true);
    expect(isReservedSlug('  WWW ')).toBe(true);
    expect(isReservedSlug('API')).toBe(true);
    expect(isReservedSlug('console')).toBe(true);
  });
  it('allows ordinary league slugs', () => {
    expect(isReservedSlug('hkbankleague2026')).toBe(false);
    expect(isReservedSlug('summer-cup')).toBe(false);
    expect(isReservedSlug('')).toBe(false);
    expect(isReservedSlug(null)).toBe(false);
  });
});

describe('isValidContactEmail', () => {
  it('accepts normal addresses', () => {
    expect(isValidContactEmail('felix@example.com')).toBe(true);
    expect(isValidContactEmail('  A.B+tag@sub.example.co.UK ')).toBe(true);
  });
  it('rejects malformed / old weak checks', () => {
    expect(isValidContactEmail('not-an-email')).toBe(false);
    expect(isValidContactEmail('a@b')).toBe(false); // no dot in domain
    expect(isValidContactEmail('a b@example.com')).toBe(false);
    expect(isValidContactEmail('@example.com')).toBe(false);
    expect(isValidContactEmail('')).toBe(false);
  });
});

describe('application state machine', () => {
  it('allows pending -> review/approve/reject/withdraw', () => {
    expect(canTransitionApplication('pending', 'in_review')).toBe(true);
    expect(canTransitionApplication('pending', 'approved')).toBe(true);
    expect(canTransitionApplication('pending', 'rejected')).toBe(true);
    expect(canTransitionApplication('pending', 'withdrawn')).toBe(true);
  });
  it('treats approved as terminal', () => {
    expect(canTransitionApplication('approved', 'pending')).toBe(false);
    expect(canTransitionApplication('approved', 'rejected')).toBe(false);
    expect(canProvision('approved')).toBe(true);
    expect(canProvision('pending')).toBe(false);
  });
  it('allows reopen from rejected/withdrawn', () => {
    expect(canTransitionApplication('rejected', 'pending')).toBe(true);
    expect(canTransitionApplication('withdrawn', 'pending')).toBe(true);
  });
  it('rejects self/illegal transitions', () => {
    expect(canTransitionApplication('pending', 'pending')).toBe(false);
    expect(() => assertApplicationTransition('approved', 'pending')).toThrow(/Illegal/);
  });
  it('assert returns target on legal transition', () => {
    expect(assertApplicationTransition('pending', 'approved')).toBe('approved');
  });
});

describe('uniqueOwnerUsername', () => {
  it('builds {slug}-owner from the slug', () => {
    expect(uniqueOwnerUsername('acme-cup', new Set())).toBe('acme-cup-owner');
  });

  it('appends an incrementing suffix when the base is taken', () => {
    const taken = new Set(['acme-cup-owner', 'acme-cup-owner-2']);
    expect(uniqueOwnerUsername('acme-cup', taken)).toBe('acme-cup-owner-3');
  });

  it('caps the username at 50 chars even for a long slug', () => {
    const name = uniqueOwnerUsername('a'.repeat(80), new Set());
    expect(name.length).toBeLessThanOrEqual(50);
    expect(name.endsWith('-owner')).toBe(true);
  });
});
