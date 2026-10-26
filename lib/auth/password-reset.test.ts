import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { getLeagueByIdMock } = vi.hoisted(() => ({
  getLeagueByIdMock: vi.fn(),
}));

vi.mock('@/lib/tenant/leagues', () => ({
  getLeagueById: getLeagueByIdMock,
}));

import { buildResetUrl, getPasswordResetOrigin } from './password-reset';

describe('getPasswordResetOrigin', () => {
  const originalBaseUrl = process.env.APP_BASE_URL;

  beforeEach(() => {
    getLeagueByIdMock.mockReset();
    process.env.APP_BASE_URL = 'https://fallback.example';
  });

  afterAll(() => {
    process.env.APP_BASE_URL = originalBaseUrl;
  });

  it('uses the canonical tenant host for a known league', async () => {
    getLeagueByIdMock.mockResolvedValue({ id: 7, slug: 'summer-cup' });

    await expect(getPasswordResetOrigin(7)).resolves.toBe(
      'https://summer-cup.zenex-sports.com'
    );
  });

  it('falls back to APP_BASE_URL when the league cannot be resolved', async () => {
    getLeagueByIdMock.mockResolvedValue(null);

    await expect(getPasswordResetOrigin(7)).resolves.toBe('https://fallback.example');
  });
});

describe('buildResetUrl', () => {
  it('builds a reset URL on the canonical league origin', async () => {
    getLeagueByIdMock.mockResolvedValue({ id: 2, slug: 'league-b' });

    await expect(buildResetUrl('abc123', 2)).resolves.toBe(
      'https://league-b.zenex-sports.com/reset-password?token=abc123'
    );
  });
});
