import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => {
  const deleteWhere = vi.fn();
  const deleteMock = vi.fn(() => ({ where: deleteWhere }));
  const onConflictDoUpdate = vi.fn();
  const valuesMock = vi.fn(() => ({ onConflictDoUpdate }));
  const insertMock = vi.fn(() => ({ values: valuesMock }));

  return {
    deleteWhere,
    deleteMock,
    onConflictDoUpdate,
    valuesMock,
    insertMock,
  };
});

vi.mock('@/lib/db', () => ({
  db: {
    delete: dbMocks.deleteMock,
    insert: dbMocks.insertMock,
  },
}));

vi.mock('./tenant/context', () => ({
  getRequestLeagueId: vi.fn(async () => 1),
}));

import { replaceMatchGoalEntries } from './queries';

beforeEach(() => {
  dbMocks.deleteWhere.mockReset();
  dbMocks.deleteMock.mockClear();
  dbMocks.onConflictDoUpdate.mockReset();
  dbMocks.valuesMock.mockClear();
  dbMocks.insertMock.mockClear();

  dbMocks.deleteWhere.mockResolvedValue([]);
  dbMocks.onConflictDoUpdate.mockResolvedValue([]);
});

describe('replaceMatchGoalEntries', () => {
  it('upserts before deleting stale goal rows', async () => {
    const calls: string[] = [];
    dbMocks.onConflictDoUpdate.mockImplementation(async () => {
      calls.push('upsert');
      return [];
    });
    dbMocks.deleteWhere.mockImplementation(async () => {
      calls.push('delete');
      return [];
    });

    await replaceMatchGoalEntries(9, [
      { playerId: 3, goals: 2 },
      { playerId: 5, goals: 1 },
    ], 7);

    expect(calls).toEqual(['upsert', 'delete']);
    expect(dbMocks.insertMock).toHaveBeenCalledTimes(1);
    expect(dbMocks.deleteMock).toHaveBeenCalledTimes(1);
  });

  it('clears all goal rows when the replacement list is empty', async () => {
    await replaceMatchGoalEntries(9, [], 7);

    expect(dbMocks.insertMock).not.toHaveBeenCalled();
    expect(dbMocks.deleteMock).toHaveBeenCalledTimes(1);
  });
});
