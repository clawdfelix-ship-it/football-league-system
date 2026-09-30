import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  rateLimit,
  getClientIp,
  selectWhere,
  select,
  transaction,
  hash,
} = vi.hoisted(() => {
  const selectWhere = vi.fn();
  const selectFrom = vi.fn(() => ({ where: selectWhere }));
  const select = vi.fn(() => ({ from: selectFrom }));

  return {
    rateLimit: vi.fn(),
    getClientIp: vi.fn(),
    selectWhere,
    select,
    transaction: vi.fn(),
    hash: vi.fn(),
  };
});

vi.mock('@/lib/api/rate-limit', () => ({
  getClientIp,
  rateLimit,
}));

vi.mock('@/lib/db', () => ({
  db: {
    select,
    transaction,
  },
}));

vi.mock('bcryptjs', () => ({
  hash,
}));

import { POST } from '@/app/api/auth/reset-password/route';

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getClientIp.mockReturnValue('127.0.0.1');
    rateLimit.mockReturnValue({ allowed: true });
    hash.mockResolvedValue('hashed-password');
    selectWhere.mockResolvedValue([]);
  });

  it('invalidates sibling reset tokens after a successful password reset', async () => {
    const consumeWhere = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 11, userId: 42 }]),
    });
    const updateUserWhere = vi.fn().mockResolvedValue(undefined);
    const invalidateOthersWhere = vi.fn().mockResolvedValue(undefined);
    const txUpdate = vi
      .fn()
      .mockReturnValueOnce({ set: vi.fn(() => ({ where: consumeWhere })) })
      .mockReturnValueOnce({ set: vi.fn(() => ({ where: updateUserWhere })) })
      .mockReturnValueOnce({ set: vi.fn(() => ({ where: invalidateOthersWhere })) });

    transaction.mockImplementation(async (callback) => callback({ update: txUpdate }));

    const response = await POST(
      new Request('http://localhost/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'a'.repeat(64),
          password: 'Password123',
        }),
        headers: {
          'content-type': 'application/json',
        },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: { message: 'Password updated. You can now sign in.' },
    });
    expect(txUpdate).toHaveBeenCalledTimes(3);
    expect(invalidateOthersWhere).toHaveBeenCalledOnce();
  });

  it('rejects a token that was consumed by a competing request', async () => {
    const consumeWhere = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([]),
    });
    const txUpdate = vi.fn().mockReturnValueOnce({ set: vi.fn(() => ({ where: consumeWhere })) });

    transaction.mockImplementation(async (callback) => callback({ update: txUpdate }));
    selectWhere.mockResolvedValue([
      {
        id: 11,
        userId: 42,
        usedAt: new Date('2026-10-01T10:05:00Z'),
        expiresAt: new Date('2026-10-01T10:30:00Z'),
      },
    ]);

    const response = await POST(
      new Request('http://localhost/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'b'.repeat(64),
          password: 'Password123',
        }),
        headers: {
          'content-type': 'application/json',
        },
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: 'TOKEN_USED',
        message: 'This reset link has already been used. Please request a new one.',
      },
    });
  });
});
