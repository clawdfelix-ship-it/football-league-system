import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAuthContext = vi.fn();
const getMatchById = vi.fn();
const getPlayersByIds = vi.fn();
const listMatchGoalEntries = vi.fn();
const replaceMatchGoalEntries = vi.fn();
const revalidateFixturesForLeague = vi.fn();

vi.mock('@/lib/authz', () => ({
  getAuthContext,
}));

vi.mock('@/lib/queries', () => ({
  getMatchById,
  getPlayersByIds,
  listMatchGoalEntries,
  replaceMatchGoalEntries,
}));

vi.mock('@/lib/fixtures-data', () => ({
  revalidateFixturesForLeague,
}));

describe('PUT /api/matches/[id]/goals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthContext.mockResolvedValue({ role: 'admin' });
    getMatchById.mockResolvedValue({
      id: 1,
      homeTeam: 'Team A',
      awayTeam: 'Team B',
      homeScore: 2,
      awayScore: 0,
    });
    getPlayersByIds.mockResolvedValue([{ id: 10, team: 'Team A' }]);
    listMatchGoalEntries.mockResolvedValue([]);
    replaceMatchGoalEntries.mockResolvedValue([]);
    revalidateFixturesForLeague.mockResolvedValue(undefined);
  });

  it('rejects duplicate player entries before replacing existing goal rows', async () => {
    const { PUT } = await import('./route');
    const response = await PUT(
      new Request('http://localhost/api/matches/1/goals', {
        method: 'PUT',
        body: JSON.stringify({
          entries: [
            { playerId: 10, goals: 1 },
            { playerId: 10, goals: 1 },
          ],
        }),
        headers: { 'content-type': 'application/json' },
      }),
      { params: Promise.resolve({ id: '1' }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Duplicate player entries are not allowed',
      },
    });
    expect(replaceMatchGoalEntries).not.toHaveBeenCalled();
    expect(revalidateFixturesForLeague).not.toHaveBeenCalled();
  });
});
