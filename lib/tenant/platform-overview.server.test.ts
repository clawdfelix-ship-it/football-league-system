import { describe, it, expect, vi, beforeEach } from 'vitest';

const { executeSpy } = vi.hoisted(() => ({ executeSpy: vi.fn() }));

vi.mock('@/lib/db', () => ({
  db: { execute: executeSpy },
}));

import { getPlatformOverview } from './platform-overview.server';

function mockRows(rows: Array<Record<string, unknown>>) {
  executeSpy.mockResolvedValue({ rows });
}

describe('getPlatformOverview', () => {
  beforeEach(() => {
    executeSpy.mockReset();
  });

  it('returns per-league stats with counts for teams/players/matches', async () => {
    mockRows([
      {
        league_id: 1,
        slug: 'hkbankleague2026',
        name: 'HK Bank League 2026',
        status: 'active',
        plan: 'founding',
        team_count: 12,
        player_count: 156,
        match_count: 48,
        last_activity_at: '2026-10-24T20:00:00Z',
      },
    ]);

    const result = await getPlatformOverview();
    expect(result.leagues).toHaveLength(1);
    expect(result.leagues[0]).toMatchObject({
      slug: 'hkbankleague2026',
      status: 'active',
      teamCount: 12,
      playerCount: 156,
      matchCount: 48,
    });
    expect(result.leagues[0].lastActivityAt).toBeInstanceOf(Date);
  });

  it('computes totals across all leagues', async () => {
    mockRows([
      {
        league_id: 1, slug: 'a', name: 'A', status: 'active', plan: null,
        team_count: 10, player_count: 100, match_count: 40, last_activity_at: null,
      },
      {
        league_id: 2, slug: 'b', name: 'B', status: 'active', plan: null,
        team_count: 8, player_count: 80, match_count: 24, last_activity_at: null,
      },
    ]);

    const result = await getPlatformOverview();
    expect(result.totals).toEqual({
      activeLeagues: 2,
      suspendedLeagues: 0,
      totalTeams: 18,
      totalPlayers: 180,
      totalMatches: 64,
    });
  });

  it('suspended leagues count separately from active', async () => {
    mockRows([
      {
        league_id: 1, slug: 'a', name: 'A', status: 'active', plan: null,
        team_count: 10, player_count: 100, match_count: 40, last_activity_at: null,
      },
      {
        league_id: 2, slug: 'b', name: 'B', status: 'suspended', plan: null,
        team_count: 8, player_count: 80, match_count: 24, last_activity_at: null,
      },
    ]);

    const result = await getPlatformOverview();
    expect(result.totals.activeLeagues).toBe(1);
    expect(result.totals.suspendedLeagues).toBe(1);
  });

  it('returns empty overview when no leagues exist', async () => {
    mockRows([]);
    const result = await getPlatformOverview();
    expect(result.leagues).toEqual([]);
    expect(result.totals.totalTeams).toBe(0);
  });
});
