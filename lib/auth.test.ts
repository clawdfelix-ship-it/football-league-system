import { beforeEach, describe, expect, it, vi } from 'vitest';

const { selectSpy } = vi.hoisted(() => ({
  selectSpy: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: selectSpy,
  },
}));

vi.mock('next-auth/providers/credentials', () => ({
  default: (config: unknown) => config,
}));

import { findLeagueAdminForImpersonation } from './auth';

describe('findLeagueAdminForImpersonation', () => {
  beforeEach(() => {
    selectSpy.mockReset();
  });

  it('fails closed when the first returned user is not an admin', async () => {
    const limitSpy = vi.fn().mockResolvedValue([
      {
        id: 5,
        email: 'manager@example.com',
        username: 'Manager',
        role: 'manager',
        leagueId: 2,
      },
    ]);
    const orderBySpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const whereSpy = vi.fn().mockReturnValue({ orderBy: orderBySpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValueOnce({ from: fromSpy });

    await expect(findLeagueAdminForImpersonation(2)).resolves.toBeNull();
  });
});
