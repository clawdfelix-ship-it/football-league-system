import { beforeEach, describe, expect, it, vi } from 'vitest';

const { selectSpy, updateSpy, hashPasswordSpy } = vi.hoisted(() => ({
  selectSpy: vi.fn(),
  updateSpy: vi.fn(),
  hashPasswordSpy: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: selectSpy,
    update: updateSpy,
  },
}));

vi.mock('@/lib/api/rate-limit', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
  rateLimit: vi.fn(() => ({ allowed: true })),
}));

vi.mock('@/lib/auth/password', () => ({
  hashPassword: hashPasswordSpy,
}));

vi.mock('@/lib/tenant/context', () => ({
  getRequestLeagueId: vi.fn(async () => 1),
}));

import { POST } from './route';

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    selectSpy.mockReset();
    updateSpy.mockReset();
    hashPasswordSpy.mockReset();
    hashPasswordSpy.mockResolvedValue('hashed-password');
  });

  it('rejects a token that loses the atomic claim race', async () => {
    const selectWhereSpy = vi.fn().mockResolvedValue([
      {
        id: 9,
        userId: 7,
        leagueId: 1,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      },
    ]);
    const selectFromSpy = vi.fn().mockReturnValue({ where: selectWhereSpy });
    selectSpy.mockReturnValueOnce({ from: selectFromSpy });

    const returningSpy = vi.fn().mockResolvedValue([]);
    const whereSpy = vi.fn().mockReturnValue({ returning: returningSpy });
    const setSpy = vi.fn().mockReturnValue({ where: whereSpy });
    updateSpy.mockReturnValueOnce({ set: setSpy });

    const response = await POST(
      new Request('http://localhost/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'a'.repeat(64),
          password: 'Pass1234',
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: 'TOKEN_USED' },
    });
    expect(updateSpy).toHaveBeenCalledTimes(1);
  });
});
