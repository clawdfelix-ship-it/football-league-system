import { beforeEach, describe, expect, it, vi } from 'vitest';

const { selectWhere, selectFrom, dbSelect, dbUpdate } = vi.hoisted(() => {
  const selectWhere = vi.fn();
  const selectFrom = vi.fn(() => ({ where: selectWhere }));
  const dbSelect = vi.fn(() => ({ from: selectFrom }));
  const dbUpdate = vi.fn();

  return { selectWhere, selectFrom, dbSelect, dbUpdate };
});

vi.mock('@/lib/db', () => ({
  db: {
    select: dbSelect,
    update: dbUpdate,
  },
}));

vi.mock('@/lib/tenant/context', () => ({
  getRequestLeagueId: vi.fn(),
}));

import { getRequestLeagueId } from '@/lib/tenant/context';
import { POST } from './route';

const mockedGetRequestLeagueId = vi.mocked(getRequestLeagueId);

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    dbSelect.mockClear();
    dbUpdate.mockClear();
    selectFrom.mockClear();
    selectWhere.mockReset();
    mockedGetRequestLeagueId.mockReset();
  });

  it('rejects a tenant reset token when redeemed from the platform host', async () => {
    mockedGetRequestLeagueId.mockResolvedValue(0);
    selectWhere.mockResolvedValue([
      {
        id: 1,
        userId: 10,
        leagueId: 7,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        usedAt: null,
      },
    ]);

    const response = await POST(
      new Request('https://example.com/api/auth/reset-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          token: 'a'.repeat(64),
          password: 'Password123',
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: 'INVALID_TOKEN',
      },
    });
    expect(dbUpdate).not.toHaveBeenCalled();
  });
});
