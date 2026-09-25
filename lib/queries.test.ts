import { beforeEach, describe, expect, it, vi } from 'vitest';

const deleteWhere = vi.fn();
const txDelete = vi.fn(() => ({ where: deleteWhere }));
const insertReturning = vi.fn();
const insertValues = vi.fn(() => ({ returning: insertReturning }));
const txInsert = vi.fn(() => ({ values: insertValues }));
const transaction = vi.fn();

const mockDb = {
  transaction,
};

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

describe('replaceMatchGoalEntries', () => {
  beforeEach(() => {
    deleteWhere.mockReset();
    txDelete.mockClear();
    insertReturning.mockReset();
    insertValues.mockClear();
    txInsert.mockClear();
    transaction.mockReset();
  });

  it('rejects duplicate player ids before touching stored rows', async () => {
    const { replaceMatchGoalEntries } = await import('@/lib/queries');

    await expect(
      replaceMatchGoalEntries(9, [
        { playerId: 11, goals: 1 },
        { playerId: 11, goals: 2 },
      ])
    ).rejects.toThrow('Duplicate playerId entries are not allowed');

    expect(transaction).not.toHaveBeenCalled();
  });

  it('replaces goal rows inside a single transaction', async () => {
    const insertedRows = [{ id: 1, matchId: 9, playerId: 11, goals: 2 }];
    insertReturning.mockResolvedValue(insertedRows);
    deleteWhere.mockResolvedValue(undefined);
    transaction.mockImplementation(async (callback) =>
      callback({
        delete: txDelete,
        insert: txInsert,
      })
    );

    const { replaceMatchGoalEntries } = await import('@/lib/queries');
    const result = await replaceMatchGoalEntries(9, [{ playerId: 11, goals: 2 }]);

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(txDelete).toHaveBeenCalledTimes(1);
    expect(txInsert).toHaveBeenCalledTimes(1);
    expect(result).toEqual(insertedRows);
  });
});
