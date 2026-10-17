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
import { getAuthContext } from '@/lib/authz';

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedGetRequestLeagueId = vi.mocked(getRequestLeagueId);

describe('getAuthContext', () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
    mockedGetRequestLeagueId.mockReset();
  });

  it('rejects manager sessions that must change password before using mutations', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: {
        role: 'manager',
        username: 'Manager',
        email: 'manager@example.com',
        teamId: 2,
        leagueId: 7,
        mustChangePassword: true,
      },
    } as never);
    mockedGetRequestLeagueId.mockResolvedValue(7);

    await expect(getAuthContext()).resolves.toBeNull();
  });

  it('rejects league-bound sessions on the wrong tenant host', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: {
        role: 'manager',
        username: 'Manager',
        email: 'manager@example.com',
        teamId: 2,
        leagueId: 7,
      },
    } as never);
    mockedGetRequestLeagueId.mockResolvedValue(9);

    await expect(getAuthContext()).resolves.toBeNull();
  });

  it('returns the scoped auth context for a valid manager session', async () => {
    mockedGetServerSession.mockResolvedValue({
      user: {
        role: 'manager',
        username: 'Manager',
        email: 'manager@example.com',
        teamId: 2,
        leagueId: 7,
      },
    } as never);
    mockedGetRequestLeagueId.mockResolvedValue(7);

    await expect(getAuthContext()).resolves.toEqual({
      role: 'manager',
      username: 'Manager',
      email: 'manager@example.com',
      teamId: 2,
      leagueId: 7,
      isPlatform: false,
    });
  });
});
