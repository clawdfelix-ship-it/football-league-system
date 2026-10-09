import { beforeEach, describe, expect, it, vi } from 'vitest';

const getServerSession = vi.fn();

vi.mock('next-auth/next', () => ({
  getServerSession,
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('getAuthContext', () => {
  beforeEach(() => {
    getServerSession.mockReset();
  });

  it('returns privileged context for admin sessions', async () => {
    getServerSession.mockResolvedValue({
      user: {
        role: 'admin',
        email: 'admin@example.com',
      },
    });

    const { getAuthContext } = await import('@/lib/authz');
    await expect(getAuthContext()).resolves.toEqual({
      role: 'admin',
      teamId: undefined,
      username: undefined,
      email: 'admin@example.com',
    });
  });

  it('rejects privileged access until forced password change is completed', async () => {
    getServerSession.mockResolvedValue({
      user: {
        role: 'manager',
        teamId: 1,
        email: 'manager@example.com',
        mustChangePassword: true,
      },
    });

    const { getAuthContext } = await import('@/lib/authz');
    await expect(getAuthContext()).resolves.toBeNull();
  });
});
