import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetAuthContext,
  mockGetMatchById,
  mockGetPlayersByIds,
  mockListMatchGoalEntries,
  mockReplaceMatchGoalEntries,
} = vi.hoisted(() => ({
  mockGetAuthContext: vi.fn(),
  mockGetMatchById: vi.fn(),
  mockGetPlayersByIds: vi.fn(),
  mockListMatchGoalEntries: vi.fn(),
  mockReplaceMatchGoalEntries: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}));

vi.mock('@/lib/authz', () => ({
  getAuthContext: mockGetAuthContext,
}));

vi.mock('@/lib/queries', () => ({
  getMatchById: mockGetMatchById,
  getPlayersByIds: mockGetPlayersByIds,
  listMatchGoalEntries: mockListMatchGoalEntries,
  replaceMatchGoalEntries: mockReplaceMatchGoalEntries,
}));

import { PUT } from '@/app/api/matches/[id]/goals/route';

describe('PUT /api/matches/[id]/goals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthContext.mockResolvedValue({ role: 'admin' });
    mockGetMatchById.mockResolvedValue({
      id: 10,
      homeTeam: 'HOME',
      awayTeam: 'AWAY',
      homeScore: 2,
      awayScore: 0,
    });
    mockGetPlayersByIds.mockResolvedValue([{ id: 1, team: 'HOME' }]);
  });

  it('rejects duplicate player entries before replacing existing match goals', async () => {
    const response = await PUT(
      new Request('http://localhost/api/matches/10/goals', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          entries: [
            { playerId: 1, goals: 1 },
            { playerId: 1, goals: 1 },
          ],
        }),
      }),
      { params: Promise.resolve({ id: '10' }) }
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Duplicate players are not allowed',
      },
    });
    expect(mockReplaceMatchGoalEntries).not.toHaveBeenCalled();
  });
});
