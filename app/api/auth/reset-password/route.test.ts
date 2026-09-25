import { beforeEach, describe, expect, it, vi } from 'vitest';

const hash = vi.fn().mockResolvedValue('hashed-password');
const rateLimit = vi.fn(() => ({ allowed: true }));
const getClientIp = vi.fn(() => '127.0.0.1');
const transaction = vi.fn();

vi.mock('bcryptjs', () => ({
  hash,
}));

vi.mock('@/lib/api/rate-limit', () => ({
  getClientIp,
  rateLimit,
}));

vi.mock('@/lib/db', () => ({
  db: {
    transaction,
  },
}));

function buildUpdateMock(firstReturningValue: unknown) {
  const update = vi.fn();

  update.mockImplementationOnce(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue(firstReturningValue),
      })),
    })),
  }));

  update.mockImplementation(() => ({
    set: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(undefined),
    })),
  }));

  return update;
}

function buildSelectMock(row: unknown) {
  return vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn().mockResolvedValue(row === undefined ? [] : [row]),
      })),
    })),
  }));
}

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    hash.mockClear();
    rateLimit.mockReturnValue({ allowed: true });
    transaction.mockReset();
  });

  it('rejects tokens issued before the latest password change', async () => {
    const consumed = [
      {
        id: 1,
        userId: 7,
        createdAt: new Date('2026-09-26T10:00:00.000Z'),
      },
    ];
    const update = buildUpdateMock(consumed);
    const select = buildSelectMock({
      id: 7,
      passwordChangedAt: new Date('2026-09-26T10:05:00.000Z'),
    });

    transaction.mockImplementation(async (callback: (tx: { update: typeof update; select: typeof select }) => Promise<unknown>) =>
      callback({ update, select })
    );

    const { POST } = await import('@/app/api/auth/reset-password/route');
    const response = await POST(
      new Request('http://localhost/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'a'.repeat(64),
          password: 'Valid1234',
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: 'TOKEN_STALE' },
    });
  });

  it('updates the password after atomically consuming the token', async () => {
    const consumed = [
      {
        id: 2,
        userId: 9,
        createdAt: new Date('2026-09-26T11:00:00.000Z'),
      },
    ];
    const update = buildUpdateMock(consumed);
    const select = buildSelectMock({
      id: 9,
      passwordChangedAt: null,
    });

    transaction.mockImplementation(async (callback: (tx: { update: typeof update; select: typeof select }) => Promise<unknown>) =>
      callback({ update, select })
    );

    const { POST } = await import('@/app/api/auth/reset-password/route');
    const response = await POST(
      new Request('http://localhost/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'b'.repeat(64),
          password: 'Valid1234',
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledTimes(3);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: { message: 'Password updated. You can now sign in.' },
    });
  });
});
