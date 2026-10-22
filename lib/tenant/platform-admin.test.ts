import { describe, it, expect } from 'vitest';
import {
  isPlatformAdminEmail,
  isPlatformAdminSessionUser,
  platformAdminEmails,
} from './platform-admin';

describe('platformAdminEmails', () => {
  it('parses comma/semicolon lists, trims, lowercases, dedupes', () => {
    const set = platformAdminEmails(' Felix@x.com , admin@x.com;  ADMIN@X.COM ');
    expect(Array.from(set).sort()).toEqual(['admin@x.com', 'felix@x.com']);
  });
  it('empty input -> empty set', () => {
    expect(platformAdminEmails('').size).toBe(0);
    expect(platformAdminEmails(undefined).size).toBe(0);
    expect(platformAdminEmails('  , ; ').size).toBe(0);
  });
});

describe('isPlatformAdminEmail', () => {
  it('matches case/space-insensitively', () => {
    expect(isPlatformAdminEmail('FELIX@x.com ', 'felix@x.com')).toBe(true);
    expect(isPlatformAdminEmail('other@x.com', 'felix@x.com')).toBe(false);
  });
  it('rejects empty', () => {
    expect(isPlatformAdminEmail('', 'felix@x.com')).toBe(false);
    expect(isPlatformAdminEmail(null, 'felix@x.com')).toBe(false);
    expect(isPlatformAdminEmail('felix@x.com', '')).toBe(false);
  });
});

describe('isPlatformAdminSessionUser', () => {
  it('accepts an allow-listed platform principal', () => {
    expect(
      isPlatformAdminSessionUser(
        { email: 'felix@x.com', isPlatform: true, leagueId: 0 },
        'felix@x.com'
      )
    ).toBe(true);
  });

  it('rejects an allow-listed league-scoped session', () => {
    expect(
      isPlatformAdminSessionUser(
        { email: 'felix@x.com', isPlatform: false, leagueId: 7 },
        'felix@x.com'
      )
    ).toBe(false);
  });

  it('rejects a non-allow-listed platform principal', () => {
    expect(
      isPlatformAdminSessionUser(
        { email: 'other@x.com', isPlatform: true, leagueId: 0 },
        'felix@x.com'
      )
    ).toBe(false);
  });
});
