import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getServerSessionSpy, isPlatformAdminEmailSpy } = vi.hoisted(() => ({
  getServerSessionSpy: vi.fn(),
  isPlatformAdminEmailSpy: vi.fn(),
}));

vi.mock('next-auth/next', () => ({
  getServerSession: getServerSessionSpy,
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/tenant/platform-admin', () => ({
  isPlatformAdminEmail: isPlatformAdminEmailSpy,
}));

vi.mock('@/lib/tenant/context', () => ({
  getRequestLeagueId: vi.fn(async () => 1),
}));

vi.mock('@/lib/tenant/team-auth.server', () => ({
  getTeamNameFromDbId: vi.fn(async () => null),
  resolveManagerTeamDbId: vi.fn(async () => null),
}));

import { getPlatformAdmin, hasPlatformPrincipalClaims } from './authz';

describe('hasPlatformPrincipalClaims', () => {
  it('accepts platform principals only when role and platform binding match', () => {
    expect(hasPlatformPrincipalClaims({ role: 'admin', isPlatform: true })).toBe(true);
    expect(hasPlatformPrincipalClaims({ role: 'admin', leagueId: 0 })).toBe(true);
    expect(hasPlatformPrincipalClaims({ role: 'manager', isPlatform: true })).toBe(false);
    expect(hasPlatformPrincipalClaims({ role: 'admin', leagueId: 1 })).toBe(false);
  });
});

describe('getPlatformAdmin', () => {
  beforeEach(() => {
    getServerSessionSpy.mockReset();
    isPlatformAdminEmailSpy.mockReset();
  });

  it('returns an allow-listed email for a real platform principal session', async () => {
    getServerSessionSpy.mockResolvedValue({
      user: { email: 'admin@example.com', role: 'admin', isPlatform: true, leagueId: 0 },
    });
    isPlatformAdminEmailSpy.mockReturnValue(true);

    await expect(getPlatformAdmin()).resolves.toEqual({
      email: 'admin@example.com',
      userId: null,
    });
  });

  it('rejects allow-listed emails carried by league-scoped sessions', async () => {
    getServerSessionSpy.mockResolvedValue({
      user: { email: 'admin@example.com', role: 'manager', isPlatform: false, leagueId: 1 },
    });
    isPlatformAdminEmailSpy.mockReturnValue(true);

    await expect(getPlatformAdmin()).resolves.toBeNull();
    expect(isPlatformAdminEmailSpy).not.toHaveBeenCalled();
  });
});
