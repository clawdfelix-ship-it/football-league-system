import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    transaction: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

import { replaceMatchGoalEntries } from '@/lib/queries';

describe('replaceMatchGoalEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('replaces goal entries inside a transaction', async () => {
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const insertReturning = vi.fn().mockResolvedValue([{ matchId: 7, playerId: 3, goals: 2 }]);
    const tx = {
      delete: vi.fn(() => ({ where: deleteWhere })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: insertReturning,
        })),
      })),
    };

    mockDb.transaction.mockImplementation(async (callback) => callback(tx as never));

    const result = await replaceMatchGoalEntries(7, [{ playerId: 3, goals: 2 }]);

    expect(mockDb.transaction).toHaveBeenCalledOnce();
    expect(tx.delete).toHaveBeenCalledOnce();
    expect(tx.insert).toHaveBeenCalledOnce();
    expect(result).toEqual([{ matchId: 7, playerId: 3, goals: 2 }]);
  });

  it('skips inserts when all entries are filtered out', async () => {
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const tx = {
      delete: vi.fn(() => ({ where: deleteWhere })),
      insert: vi.fn(),
    };

    mockDb.transaction.mockImplementation(async (callback) => callback(tx as never));

    const result = await replaceMatchGoalEntries(9, [{ playerId: 5, goals: 0 }]);

    expect(tx.delete).toHaveBeenCalledOnce();
    expect(tx.insert).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
