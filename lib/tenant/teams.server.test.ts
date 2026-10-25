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
  listTeamsForLeague,
  createTeam,
  updateTeam,
  deleteTeam,
  TeamError,
} from './teams.server';

describe('listTeamsForLeague', () => {
  beforeEach(() => {
    selectSpy.mockReset();
  });

  it('returns teams ordered by sort_order then id, scoped to league', async () => {
    const orderBySpy = vi.fn().mockResolvedValue([
      { id: 1, name: 'BBVA', shortName: 'BBVA', sortOrder: 1, leagueId: 1 },
      { id: 2, name: 'CITI', shortName: 'CITI', sortOrder: 2, leagueId: 1 },
    ]);
    const whereSpy = vi.fn().mockReturnValue({ orderBy: orderBySpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValue({ from: fromSpy });

    const rows = await listTeamsForLeague(1);
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe('BBVA');
  });
});

describe('createTeam', () => {
  beforeEach(() => {
    selectSpy.mockReset();
    insertSpy.mockReset();
  });

  it('inserts a new team with the given league_id and returns it', async () => {
    // Uniqueness check: no existing team with same name in this league
    const limitSpy = vi.fn().mockResolvedValue([]);
    const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValue({ from: fromSpy });

    const returningSpy = vi.fn().mockResolvedValue([
      { id: 11, name: 'NEWBIE', shortName: 'NEW', leagueId: 1 },
    ]);
    const valuesSpy = vi.fn().mockReturnValue({ returning: returningSpy });
    insertSpy.mockReturnValue({ values: valuesSpy });

    const team = await createTeam(1, { name: 'NEWBIE', shortName: 'NEW' });
    expect(team.id).toBe(11);
    expect(team.leagueId).toBe(1);
  });

  it('rejects duplicate team name in the same league', async () => {
    const limitSpy = vi.fn().mockResolvedValue([{ id: 1 }]);
    const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValue({ from: fromSpy });

    await expect(createTeam(1, { name: 'BBVA' })).rejects.toMatchObject({
      code: 'NAME_TAKEN',
    });
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('rejects empty name', async () => {
    await expect(createTeam(1, { name: '  ' })).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
  });
});

describe('updateTeam', () => {
  beforeEach(() => {
    selectSpy.mockReset();
    updateSpy.mockReset();
  });

  it('throws NOT_FOUND when team does not exist in this league', async () => {
    const limitSpy = vi.fn().mockResolvedValue([]);
    const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValue({ from: fromSpy });

    await expect(updateTeam(1, 999, { name: 'X' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('updates only the provided fields', async () => {
    // Team exists (first select)
    const limitSpy1 = vi.fn().mockResolvedValue([{ id: 5, leagueId: 1, name: 'OLD' }]);
    const whereSpy1 = vi.fn().mockReturnValue({ limit: limitSpy1 });
    const fromSpy1 = vi.fn().mockReturnValue({ where: whereSpy1 });

    // Duplicate name check: no dupe (second select)
    const limitSpy2 = vi.fn().mockResolvedValue([]);
    const whereSpy2 = vi.fn().mockReturnValue({ limit: limitSpy2 });
    const fromSpy2 = vi.fn().mockReturnValue({ where: whereSpy2 });

    selectSpy
      .mockReturnValueOnce({ from: fromSpy1 })
      .mockReturnValueOnce({ from: fromSpy2 });

    // Update
    const updateWhereSpy = vi.fn().mockResolvedValue(undefined);
    const setSpy = vi.fn().mockReturnValue({ where: updateWhereSpy });
    updateSpy.mockReturnValue({ set: setSpy });

    await updateTeam(1, 5, { name: 'NEW', venue: 'Happy Valley' });

    const setArg = setSpy.mock.calls[0][0];
    expect(setArg.name).toBe('NEW');
    expect(setArg.venue).toBe('Happy Valley');
    expect(setArg.shortName).toBeUndefined(); // not provided
    expect(setArg.updatedAt).toBeInstanceOf(Date);
  });
});

describe('deleteTeam', () => {
  beforeEach(() => {
    selectSpy.mockReset();
    deleteSpy.mockReset();
  });

  it('refuses to delete when the team has matches (FK violation risk)', async () => {
    // Team exists
    const teamLimitSpy = vi.fn().mockResolvedValue([{ id: 5, leagueId: 1, name: 'X' }]);
    const teamWhereSpy = vi.fn().mockReturnValue({ limit: teamLimitSpy });
    const teamFromSpy = vi.fn().mockReturnValue({ where: teamWhereSpy });

    // Matches check returns at least one match
    const matchLimitSpy = vi.fn().mockResolvedValue([{ id: 100 }]);
    const matchWhereSpy = vi.fn().mockReturnValue({ limit: matchLimitSpy });
    const matchFromSpy = vi.fn().mockReturnValue({ where: matchWhereSpy });

    selectSpy
      .mockReturnValueOnce({ from: teamFromSpy })   // team check
      .mockReturnValueOnce({ from: matchFromSpy }); // matches check

    await expect(deleteTeam(1, 5)).rejects.toMatchObject({ code: 'HAS_MATCHES' });
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('refuses to delete when the team has players', async () => {
    const teamLimitSpy = vi.fn().mockResolvedValue([{ id: 5, leagueId: 1, name: 'X' }]);
    const teamWhereSpy = vi.fn().mockReturnValue({ limit: teamLimitSpy });
    const teamFromSpy = vi.fn().mockReturnValue({ where: teamWhereSpy });

    const matchLimitSpy = vi.fn().mockResolvedValue([]);
    const matchWhereSpy = vi.fn().mockReturnValue({ limit: matchLimitSpy });
    const matchFromSpy = vi.fn().mockReturnValue({ where: matchWhereSpy });

    const playerLimitSpy = vi.fn().mockResolvedValue([{ id: 50 }]);
    const playerWhereSpy = vi.fn().mockReturnValue({ limit: playerLimitSpy });
    const playerFromSpy = vi.fn().mockReturnValue({ where: playerWhereSpy });

    selectSpy
      .mockReturnValueOnce({ from: teamFromSpy })
      .mockReturnValueOnce({ from: matchFromSpy })
      .mockReturnValueOnce({ from: playerFromSpy });

    await expect(deleteTeam(1, 5)).rejects.toMatchObject({ code: 'HAS_PLAYERS' });
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('deletes when no matches or players reference the team', async () => {
    const teamLimitSpy = vi.fn().mockResolvedValue([{ id: 5, leagueId: 1, name: 'X' }]);
    const teamWhereSpy = vi.fn().mockReturnValue({ limit: teamLimitSpy });
    const teamFromSpy = vi.fn().mockReturnValue({ where: teamWhereSpy });

    const matchLimitSpy = vi.fn().mockResolvedValue([]);
    const matchWhereSpy = vi.fn().mockReturnValue({ limit: matchLimitSpy });
    const matchFromSpy = vi.fn().mockReturnValue({ where: matchWhereSpy });

    const playerLimitSpy = vi.fn().mockResolvedValue([]);
    const playerWhereSpy = vi.fn().mockReturnValue({ limit: playerLimitSpy });
    const playerFromSpy = vi.fn().mockReturnValue({ where: playerWhereSpy });

    selectSpy
      .mockReturnValueOnce({ from: teamFromSpy })
      .mockReturnValueOnce({ from: matchFromSpy })
      .mockReturnValueOnce({ from: playerFromSpy });

    const delWhereSpy = vi.fn().mockResolvedValue(undefined);
    deleteSpy.mockReturnValue({ where: delWhereSpy });

    await deleteTeam(1, 5);
    expect(deleteSpy).toHaveBeenCalled();
  });

  it('throws NOT_FOUND when team does not exist in this league', async () => {
    const limitSpy = vi.fn().mockResolvedValue([]);
    const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValue({ from: fromSpy });

    await expect(deleteTeam(1, 999)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('TeamError', () => {
  it('carries code + message', () => {
    const err = new TeamError('NAME_TAKEN', 'Team name taken');
    expect(err.code).toBe('NAME_TAKEN');
    expect(err).toBeInstanceOf(Error);
  });
});
