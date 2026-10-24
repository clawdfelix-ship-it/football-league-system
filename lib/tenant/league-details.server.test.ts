import { describe, it, expect, vi, beforeEach } from 'vitest';

const { executeSpy } = vi.hoisted(() => ({ executeSpy: vi.fn() }));

vi.mock('@/lib/db', () => ({
  db: { execute: executeSpy },
}));

import { getLeagueDetails } from './league-details.server';

function mockRowsOnce(rows: Array<Record<string, unknown>>) {
  executeSpy.mockResolvedValueOnce({ rows });
}

describe('getLeagueDetails', () => {
  beforeEach(() => {
    executeSpy.mockReset();
  });

  it('returns null when league does not exist', async () => {
    // First query: league row. Empty = not found.
    mockRowsOnce([]);
    const result = await getLeagueDetails(999);
    expect(result).toBeNull();
  });

  it('aggregates stats, recent matches, managers, and recent activity', async () => {
    // 1. League row
    mockRowsOnce([
      {
        id: 1,
        slug: 'hkbankleague2026',
        name: 'HK Bank League 2026',
        status: 'active',
        plan: 'founding',
        created_at: '2026-10-10T17:53:03Z',
      },
    ]);
    // 2. Stats (one row with counts)
    mockRowsOnce([
      { team_count: 12, player_count: 156, match_count: 48, announcement_count: 3 },
    ]);
    // 3. Recent matches
    mockRowsOnce([
      {
        id: 100,
        home_team: 'Team A',
        away_team: 'Team B',
        home_score: 2,
        away_score: 1,
        match_date: '2026-10-23',
        updated_at: '2026-10-23T22:00:00Z',
      },
    ]);
    // 4. Managers
    mockRowsOnce([
      {
        id: 5,
        email: 'manager@team.com',
        username: 'team-manager',
        role: 'manager',
        password_changed_at: '2026-10-20T10:00:00Z',
      },
    ]);
    // 5. Recent activity
    mockRowsOnce([
      {
        kind: 'match',
        label: 'Team A vs Team B — 2:1',
        happened_at: '2026-10-23T22:00:00Z',
      },
      {
        kind: 'team',
        label: 'Team C added',
        happened_at: '2026-10-22T15:00:00Z',
      },
    ]);

    const result = await getLeagueDetails(1);

    expect(result).not.toBeNull();
    expect(result!.league).toMatchObject({ slug: 'hkbankleague2026', status: 'active' });
    expect(result!.stats).toEqual({
      teamCount: 12,
      playerCount: 156,
      matchCount: 48,
      announcementCount: 3,
    });
    expect(result!.recentMatches).toHaveLength(1);
    expect(result!.recentMatches[0]).toMatchObject({ homeTeam: 'Team A', homeScore: 2 });
    expect(result!.managers).toHaveLength(1);
    expect(result!.managers[0].email).toBe('manager@team.com');
    expect(result!.recentActivity).toHaveLength(2);
    expect(result!.recentActivity[0].kind).toBe('match');
  });

  it('handles leagues with no managers or activity (empty arrays, not null)', async () => {
    mockRowsOnce([
      { id: 1, slug: 'x', name: 'X', status: 'active', plan: null, created_at: '2026-01-01' },
    ]);
    mockRowsOnce([{ team_count: 0, player_count: 0, match_count: 0, announcement_count: 0 }]);
    mockRowsOnce([]);
    mockRowsOnce([]);
    mockRowsOnce([]);

    const result = await getLeagueDetails(1);
    expect(result!.recentMatches).toEqual([]);
    expect(result!.managers).toEqual([]);
    expect(result!.recentActivity).toEqual([]);
  });
});
