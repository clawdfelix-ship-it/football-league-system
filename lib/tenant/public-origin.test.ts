import { describe, expect, it } from 'vitest';
import { getTrustedPublicOrigin } from './public-origin';

describe('getTrustedPublicOrigin', () => {
  it('keeps real tenant hosts under the managed base domain', () => {
    expect(
      getTrustedPublicOrigin(
        'hkbankleague2026.zenex-sports.com',
        'https://football-league-system-zenex.vercel.app'
      )
    ).toBe('https://hkbankleague2026.zenex-sports.com');
  });

  it('keeps real platform hosts under the managed base domain', () => {
    expect(
      getTrustedPublicOrigin(
        'platform.zenex-sports.com',
        'https://football-league-system-zenex.vercel.app'
      )
    ).toBe('https://platform.zenex-sports.com');
  });

  it('falls back for arbitrary untrusted hosts', () => {
    expect(
      getTrustedPublicOrigin(
        'evil.example',
        'https://football-league-system-zenex.vercel.app'
      )
    ).toBe('https://football-league-system-zenex.vercel.app');
  });

  it('preserves the configured fallback origin for local development hosts', () => {
    expect(
      getTrustedPublicOrigin('localhost:3000', 'http://localhost:3000')
    ).toBe('http://localhost:3000');
  });
});
