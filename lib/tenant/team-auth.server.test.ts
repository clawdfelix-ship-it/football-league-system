import { describe, it, expect, vi, beforeEach } from 'vitest';

const { selectSpy, updateSpy } = vi.hoisted(() => ({
  selectSpy: vi.fn(),
  updateSpy: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: { select: selectSpy, update: updateSpy },
}));

vi.mock('@/lib/teams/load', () => ({
  getTeamsForCurrentLeague: vi.fn(async () => [
    { name: 'NOMURA', nameZh: '野村', shortName: 'NOMURA', color: '' },
    { name: 'BBVA', nameZh: '西班牙對外銀行', shortName: 'BBVA', color: '' },
  ]),
}));

import {
  resolveManagerTeamDbId,
  getTeamNameFromDbId,
  migrateSessionTeamId,
  TeamAuthError,
} from './team-auth.server';

describe('resolveManagerTeamDbId', () => {
  beforeEach(() => {
    selectSpy.mockReset();
    updateSpy.mockReset();
  });

  it('returns DB id when user has team_id set', async () => {
    const limitSpy = vi.fn().mockResolvedValue([{ teamId: 42 }]);
    const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValue({ from: fromSpy });

    const result = await resolveManagerTeamDbId('bbva-ibai@example.com');
    expect(result).toBe(42);
  });

  it('falls back to array index mapping when team_id is NULL', async () => {
    // First call: user lookup returns teamId=null
    const userLimitSpy = vi.fn().mockResolvedValue([{ teamId: null }]);
    const userWhereSpy = vi.fn().mockReturnValue({ limit: userLimitSpy });
    const userFromSpy = vi.fn().mockReturnValue({ where: userWhereSpy });

    // Second call: team lookup by shortName prefix "BBVA"
    const teamLimitSpy = vi.fn().mockResolvedValue([{ id: 2 }]);
    const teamWhereSpy = vi.fn().mockReturnValue({ limit: teamLimitSpy });
    const teamFromSpy = vi.fn().mockReturnValue({ where: teamWhereSpy });

    selectSpy
      .mockReturnValueOnce({ from: userFromSpy })
      .mockReturnValueOnce({ from: teamFromSpy });

    const result = await resolveManagerTeamDbId('bbva-ibai@example.com');
    expect(result).toBe(2);
  });

  it('returns null for unknown email', async () => {
    const limitSpy = vi.fn().mockResolvedValue([]);
    const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValue({ from: fromSpy });

    const result = await resolveManagerTeamDbId('unknown@example.com');
    expect(result).toBeNull();
  });
});

describe('getTeamNameFromDbId', () => {
  beforeEach(() => {
    selectSpy.mockReset();
  });

  it('returns team name for valid DB id', async () => {
    const limitSpy = vi.fn().mockResolvedValue([{ name: 'BBVA' }]);
    const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValue({ from: fromSpy });

    expect(await getTeamNameFromDbId(2)).toBe('BBVA');
  });

  it('returns null for unknown DB id', async () => {
    const limitSpy = vi.fn().mockResolvedValue([]);
    const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValue({ from: fromSpy });

    expect(await getTeamNameFromDbId(999)).toBeNull();
  });
});

describe('migrateSessionTeamId', () => {
  beforeEach(() => {
    selectSpy.mockReset();
    updateSpy.mockReset();
  });

  it('converts array index to DB id and persists to user row', async () => {
    // 1. Find user by email
    const userLimitSpy = vi.fn().mockResolvedValue([{ id: 5, teamId: null, email: 'nomura-terrence@example.com' }]);
    const userWhereSpy = vi.fn().mockReturnValue({ limit: userLimitSpy });
    const userFromSpy = vi.fn().mockReturnValue({ where: userWhereSpy });

    // 2. Find team by shortName prefix "NOMURA"
    const teamLimitSpy = vi.fn().mockResolvedValue([{ id: 1 }]);
    const teamWhereSpy = vi.fn().mockReturnValue({ limit: teamLimitSpy });
    const teamFromSpy = vi.fn().mockReturnValue({ where: teamWhereSpy });

    selectSpy
      .mockReturnValueOnce({ from: userFromSpy })
      .mockReturnValueOnce({ from: teamFromSpy });

    const setSpy = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    updateSpy.mockReturnValue({ set: setSpy });

    const result = await migrateSessionTeamId('nomura-terrence@example.com', 0); // array index 0 = NOMURA
    expect(result).toBe(1); // DB id 1
    expect(updateSpy).toHaveBeenCalled();
  });

  it('returns existing team_id if already migrated', async () => {
    const limitSpy = vi.fn().mockResolvedValue([{ id: 5, teamId: 42, email: 'x@example.com' }]);
    const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValue({ from: fromSpy });

    const result = await migrateSessionTeamId('x@example.com', 0);
    expect(result).toBe(42);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('throws MIGRATION_FAILED when team not found for array index', async () => {
    const userLimitSpy = vi.fn().mockResolvedValue([{ id: 5, teamId: null, email: 'x@example.com' }]);
    const userWhereSpy = vi.fn().mockReturnValue({ limit: userLimitSpy });
    const userFromSpy = vi.fn().mockReturnValue({ where: userWhereSpy });

    const teamLimitSpy = vi.fn().mockResolvedValue([]); // team not found
    const teamWhereSpy = vi.fn().mockReturnValue({ limit: teamLimitSpy });
    const teamFromSpy = vi.fn().mockReturnValue({ where: teamWhereSpy });

    selectSpy
      .mockReturnValueOnce({ from: userFromSpy })
      .mockReturnValueOnce({ from: teamFromSpy });

    await expect(migrateSessionTeamId('x@example.com', 999)).rejects.toMatchObject({
      code: 'MIGRATION_FAILED',
    });
  });
});

describe('TeamAuthError', () => {
  it('carries code + message', () => {
    const err = new TeamAuthError('MIGRATION_FAILED', 'test');
    expect(err.code).toBe('MIGRATION_FAILED');
    expect(err).toBeInstanceOf(Error);
  });
});
