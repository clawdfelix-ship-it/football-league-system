import { describe, expect, it } from 'vitest';
import {
  buildResetUrl,
  canRedeemResetTokenOnLeague,
  isAllowedResetHost,
} from './password-reset';

describe('isAllowedResetHost', () => {
  it('accepts the platform apex and tenant subdomains', () => {
    expect(isAllowedResetHost('zenex-sports.com')).toBe(true);
    expect(isAllowedResetHost('summer-cup.zenex-sports.com')).toBe(true);
  });

  it('rejects untrusted hosts', () => {
    expect(isAllowedResetHost('evil.example.com')).toBe(false);
    expect(isAllowedResetHost('zenex-sports.com.evil.example.com')).toBe(false);
    expect(isAllowedResetHost('localhost:3000')).toBe(false);
  });
});

describe('buildResetUrl', () => {
  it('keeps trusted tenant hosts in reset links', () => {
    expect(buildResetUrl('abc123', 'summer-cup.zenex-sports.com', 'https://fallback.example.com'))
      .toBe('https://summer-cup.zenex-sports.com/reset-password?token=abc123');
  });

  it('falls back to the configured base url for untrusted hosts', () => {
    expect(buildResetUrl('abc123', 'evil.example.com', 'https://app.example.com/'))
      .toBe('https://app.example.com/reset-password?token=abc123');
  });
});

describe('canRedeemResetTokenOnLeague', () => {
  it('requires an exact tenant league match', () => {
    expect(canRedeemResetTokenOnLeague(2, 2)).toBe(true);
    expect(canRedeemResetTokenOnLeague(2, 0)).toBe(false);
    expect(canRedeemResetTokenOnLeague(2, 3)).toBe(false);
  });
});
