import { describe, it, expect } from 'vitest';
import { isPlatformAdminEmail, platformAdminEmails } from './platform-admin';

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
