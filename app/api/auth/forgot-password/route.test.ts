import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildResetUrl } from './route';

describe('buildResetUrl', () => {
  const originalBaseUrl = process.env.APP_BASE_URL;

  beforeEach(() => {
    process.env.APP_BASE_URL = 'https://platform.zenex-sports.com';
  });

  afterEach(() => {
    process.env.APP_BASE_URL = originalBaseUrl;
  });

  it('uses trusted tenant hosts for reset links', () => {
    const url = buildResetUrl('a'.repeat(64), 'hkbankleague2026.zenex-sports.com');
    expect(url).toBe(
      `https://hkbankleague2026.zenex-sports.com/reset-password?token=${'a'.repeat(64)}`
    );
  });

  it('falls back to APP_BASE_URL for untrusted hosts', () => {
    const url = buildResetUrl('b'.repeat(64), 'attacker.example');
    expect(url).toBe(
      `https://platform.zenex-sports.com/reset-password?token=${'b'.repeat(64)}`
    );
  });
});
