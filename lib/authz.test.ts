import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/tenant/context', () => ({
  getRequestLeagueId: vi.fn(),
}));

import { getServerSession } from 'next-auth/next';
import { getRequestLeagueId } from '@/lib/tenant/context';
import { getAuthContext, getPlatformAdmin } from './authz';

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedGetRequestLeagueId = vi.mocked(getRequestLeagueId);

describe('getPlatformAdmin', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.PLATFORM_ADMIN_EMAILS = 'platform@example.com';
  });

  it('accepts an allow-listed platform principal', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: {
        email: 'platform@example.com',
        isPlatform: true,
        leagueId: 0,
      },
    } as never);

    expect(
      await getPlatformAdmin()
    ).toEqual({ email: 'platform@example.com', userId: null });
  });

  it('rejects an allow-listed email when the session is only league-scoped', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: {
        email: 'platform@example.com',
        isPlatform: false,
        leagueId: 2,
      },
    } as never);

    await expect(getPlatformAdmin()).resolves.toBeNull();
  });
});

describe('getAuthContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.PLATFORM_ADMIN_EMAILS = 'platform@example.com';
  });

  it('denies a league-bound admin when the host league does not match the session league', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: {
        role: 'admin',
        email: 'owner@example.com',
        leagueId: 2,
        isPlatform: false,
      },
    } as never);
    mockedGetRequestLeagueId.mockResolvedValue(3);

    await expect(getAuthContext()).resolves.toBeNull();
  });
});
