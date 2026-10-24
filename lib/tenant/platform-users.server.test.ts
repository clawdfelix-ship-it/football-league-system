import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { selectSpy, updateSpy, insertSpy } = vi.hoisted(() => ({
  selectSpy: vi.fn(),
  updateSpy: vi.fn(),
  insertSpy: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: { select: selectSpy, update: updateSpy, insert: insertSpy },
}));

vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn(async (pw: string) => `hashed:${pw}`),
}));

vi.mock('@/lib/auth/temp-password', () => ({
  generateTempPassword: vi.fn(() => 'TempPass123!'),
}));

import {
  searchPlatformUsers,
  resetUserPassword,
  PlatformUserError,
} from './platform-users.server';

describe('searchPlatformUsers', () => {
  beforeEach(() => {
    selectSpy.mockReset();
    updateSpy.mockReset();
    insertSpy.mockReset();
  });

  it('returns users matching email substring, with league slug/name joined', async () => {
    const whereSpy = vi.fn().mockResolvedValue([
      {
        id: 5,
        email: 'manager@team.com',
        username: 'team-manager',
        role: 'manager',
        leagueId: 1,
        mustChangePassword: null,
        createdAt: new Date('2026-10-01'),
        leagueSlug: 'hkbankleague2026',
        leagueName: 'HK Bank League 2026',
      },
    ]);
    const leftJoinSpy = vi.fn().mockReturnValue({ where: whereSpy });
    const fromSpy = vi.fn().mockReturnValue({ leftJoin: leftJoinSpy });
    const limitSpy = vi.fn().mockReturnValue({ leftJoin: leftJoinSpy });
    // db.select().from().leftJoin().where().limit() chain
    selectSpy.mockReturnValue({ from: fromSpy });
    // make where also return a limit-able object
    whereSpy.mockReturnValue({ limit: vi.fn().mockResolvedValue([
      {
        id: 5,
        email: 'manager@team.com',
        username: 'team-manager',
        role: 'manager',
        leagueId: 1,
        mustChangePassword: null,
        createdAt: new Date('2026-10-01'),
        leagueSlug: 'hkbankleague2026',
        leagueName: 'HK Bank League 2026',
      },
    ]) });

    const rows = await searchPlatformUsers('manager');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      email: 'manager@team.com',
      leagueSlug: 'hkbankleague2026',
    });
  });
});

describe('resetUserPassword', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    selectSpy.mockReset();
    updateSpy.mockReset();
    insertSpy.mockReset();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  function mockSelectUserOnce(rows: unknown[]) {
    const limitSpy = vi.fn().mockResolvedValue(rows);
    const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValueOnce({ from: fromSpy });
  }

  function mockUpdateOnce() {
    const whereSpy = vi.fn().mockResolvedValue(undefined);
    const setSpy = vi.fn().mockReturnValue({ where: whereSpy });
    updateSpy.mockReturnValueOnce({ set: setSpy });
    return { setSpy, whereSpy };
  }

  it('throws NOT_FOUND when user does not exist', async () => {
    mockSelectUserOnce([]);
    await expect(
      resetUserPassword(999, { email: 'admin@x.com', userId: null })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('resets password: hashes temp password, sets mustChangePassword, writes audit', async () => {
    mockSelectUserOnce([
      { id: 5, email: 'm@t.com', username: 'm-t', role: 'manager', leagueId: 1 },
    ]);
    const { setSpy } = mockUpdateOnce();
    const valuesSpy = vi.fn().mockResolvedValue(undefined);
    insertSpy.mockReturnValue({ values: valuesSpy });

    const result = await resetUserPassword(5, { email: 'admin@x.com', userId: null });

    // Update called with hashed temp password + mustChangePassword set
    const setArg = setSpy.mock.calls[0][0];
    expect(setArg.passwordHash).toBe('hashed:TempPass123!');
    expect(setArg.mustChangePassword).toBeInstanceOf(Date);

    // Audit row written
    expect(valuesSpy).toHaveBeenCalled();
    const auditArg = valuesSpy.mock.calls[0][0];
    expect(auditArg.action).toBe('user.reset_password');
    expect(auditArg.targetType).toBe('user');
    expect(auditArg.targetId).toBe(5);

    // Returns the plaintext temp password (shown once to admin)
    expect(result.tempPassword).toBe('TempPass123!');
    expect(result.email).toBe('m@t.com');
  });

  it('rejects resetting a platform-admin email account (env principals have no users row)', async () => {
    mockSelectUserOnce([
      { id: 9, email: 'felix3216@gmail.com', username: 'admin', role: 'admin', leagueId: null },
    ]);

    await expect(
      resetUserPassword(9, { email: 'admin@x.com', userId: null })
    ).rejects.toMatchObject({ code: 'FORBIDDEN_TARGET' });
  });
});
