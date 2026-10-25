import { describe, it, expect, vi, beforeEach } from 'vitest';

const { selectSpy, insertSpy, updateSpy, deleteSpy } = vi.hoisted(() => ({
  selectSpy: vi.fn(),
  insertSpy: vi.fn(),
  updateSpy: vi.fn(),
  deleteSpy: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: { select: selectSpy, insert: insertSpy, update: updateSpy, delete: deleteSpy },
}));

import {
  getTeamAssociations,
  deleteTeamCascade,
  archiveTeam,
  TeamError,
} from './teams.server';

// Helper to build a chainable select mock that resolves via .limit()
function mockSelect(rows: unknown[]) {
  const limitSpy = vi.fn().mockResolvedValue(rows);
  const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
  const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
  selectSpy.mockReturnValueOnce({ from: fromSpy });
}

// Helper for count queries that resolve directly on .where() (no .limit())
function mockSelectCount(count: number) {
  const whereSpy = vi.fn().mockResolvedValue([{ count }]);
  const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
  selectSpy.mockReturnValueOnce({ from: fromSpy });
}

function mockUpdate() {
  const whereSpy = vi.fn().mockResolvedValue(undefined);
  const setSpy = vi.fn().mockReturnValue({ where: whereSpy });
  updateSpy.mockReturnValueOnce({ set: setSpy });
  return setSpy;
}

function mockDelete() {
  const whereSpy = vi.fn().mockResolvedValue(undefined);
  deleteSpy.mockReturnValueOnce({ where: whereSpy });
}

describe('getTeamAssociations', () => {
  beforeEach(() => {
    selectSpy.mockReset();
  });

  it('returns playerCount + matchCount', async () => {
    // Team exists
    mockSelect([{ id: 10, leagueId: 1, name: 'DEMO' }]);
    // Player count (no .limit() — resolves on .where())
    mockSelectCount(5);
    // Match count
    mockSelectCount(0);

    const result = await getTeamAssociations(1, 10);
    expect(result).toEqual({ playerCount: 5, matchCount: 0 });
  });

  it('throws NOT_FOUND when team not in league', async () => {
    mockSelect([]);
    await expect(getTeamAssociations(1, 999)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('deleteTeamCascade', () => {
  beforeEach(() => {
    selectSpy.mockReset();
    updateSpy.mockReset();
    deleteSpy.mockReset();
  });

  it('mode=release: sets players.team_id to NULL, then deletes team', async () => {
    mockSelect([{ id: 10, leagueId: 1, name: 'DEMO' }]); // team
    mockSelectCount(3); // players
    mockSelectCount(0); // matches

    mockUpdate(); // release players
    mockDelete(); // delete team

    await deleteTeamCascade(1, 10, 'release');

    expect(updateSpy).toHaveBeenCalledTimes(1); // players update
    expect(deleteSpy).toHaveBeenCalledTimes(1); // team delete
  });

  it('mode=delete: deletes players first, then team', async () => {
    mockSelect([{ id: 10, leagueId: 1, name: 'DEMO' }]);
    mockSelectCount(3);
    mockSelectCount(0);

    mockDelete(); // delete players
    mockDelete(); // delete team

    await deleteTeamCascade(1, 10, 'delete');

    expect(deleteSpy).toHaveBeenCalledTimes(2);
  });

  it('refuses both modes when team has matches', async () => {
    mockSelect([{ id: 10, leagueId: 1, name: 'DEMO' }]);
    mockSelectCount(3); // players
    mockSelectCount(2); // matches — has history

    await expect(deleteTeamCascade(1, 10, 'release')).rejects.toMatchObject({ code: 'HAS_MATCHES' });

    // Reset for second call
    mockSelect([{ id: 10, leagueId: 1, name: 'DEMO' }]);
    mockSelectCount(3);
    mockSelectCount(2);

    await expect(deleteTeamCascade(1, 10, 'delete')).rejects.toMatchObject({ code: 'HAS_MATCHES' });
  });
});

describe('archiveTeam', () => {
  beforeEach(() => {
    selectSpy.mockReset();
    updateSpy.mockReset();
  });

  it('sets status=archived and bumps updatedAt', async () => {
    mockSelect([{ id: 10, leagueId: 1, name: 'DEMO', status: 'active' }]);
    const setSpy = mockUpdate();

    await archiveTeam(1, 10);

    const setArg = setSpy.mock.calls[0][0];
    expect(setArg.status).toBe('archived');
    expect(setArg.updatedAt).toBeInstanceOf(Date);
  });

  it('is a no-op when already archived', async () => {
    mockSelect([{ id: 10, leagueId: 1, name: 'DEMO', status: 'archived' }]);
    await archiveTeam(1, 10);
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
