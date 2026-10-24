import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoisted spies so the mocked db module can wire them together.
const { selectSpy, updateSpy, insertSpy } = vi.hoisted(() => ({
  selectSpy: vi.fn(),
  updateSpy: vi.fn(),
  insertSpy: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: selectSpy,
    update: updateSpy,
    insert: insertSpy,
  },
}));

import { setLeagueStatus } from './league-lifecycle.server';
import { LeagueError } from './league-lifecycle';

// Helper to build a chainable select mock that resolves `rows` on limit().
function mockSelectOnce(rows: unknown[]) {
  const limitSpy = vi.fn().mockResolvedValue(rows);
  const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
  const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
  selectSpy.mockReturnValueOnce({ from: fromSpy });
  return { limitSpy, whereSpy, fromSpy };
}

function mockUpdateOnce() {
  const whereSpy = vi.fn().mockResolvedValue(undefined);
  const setSpy = vi.fn().mockReturnValue({ where: whereSpy });
  updateSpy.mockReturnValueOnce({ set: setSpy });
  return { whereSpy, setSpy };
}

function mockInsertOnce() {
  const valuesSpy = vi.fn().mockResolvedValue(undefined);
  insertSpy.mockReturnValueOnce({ values: valuesSpy });
  return { valuesSpy };
}

const actor = { email: 'admin@example.com', userId: null };
const meta = { ip: '1.2.3.4', userAgent: 'vitest' };

const fakeLeague = {
  id: 12,
  slug: 'hkbankleague2026',
  name: 'HK Bank League 2026',
  status: 'active',
};

describe('setLeagueStatus', () => {
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

  it('updates the league status and writes an audit row', async () => {
    mockSelectOnce([fakeLeague]);
    const { setSpy } = mockUpdateOnce();
    const { valuesSpy } = mockInsertOnce();

    await setLeagueStatus(12, 'suspended', actor, meta);

    expect(setSpy).toHaveBeenCalled();
    const setArg = setSpy.mock.calls[0][0];
    expect(setArg.status).toBe('suspended');
    expect(setArg.updatedAt).toBeInstanceOf(Date);

    expect(valuesSpy).toHaveBeenCalled();
    const auditArg = valuesSpy.mock.calls[0][0];
    expect(auditArg).toMatchObject({
      actorEmail: 'admin@example.com',
      action: 'league.suspend',
      targetType: 'league',
      targetId: 12,
      targetLabel: 'hkbankleague2026',
    });
    expect(auditArg.metadata).toMatchObject({ from: 'active', to: 'suspended' });
  });

  it('uses action league.reactivate when going back to active', async () => {
    mockSelectOnce([{ ...fakeLeague, status: 'suspended' }]);
    mockUpdateOnce();
    const { valuesSpy } = mockInsertOnce();

    await setLeagueStatus(12, 'active', actor, meta);

    const auditArg = valuesSpy.mock.calls[0][0];
    expect(auditArg.action).toBe('league.reactivate');
    expect(auditArg.metadata).toMatchObject({ from: 'suspended', to: 'active' });
  });

  it('uses action league.close when closing', async () => {
    mockSelectOnce([fakeLeague]);
    mockUpdateOnce();
    const { valuesSpy } = mockInsertOnce();

    await setLeagueStatus(12, 'closed', actor, meta);

    const auditArg = valuesSpy.mock.calls[0][0];
    expect(auditArg.action).toBe('league.close');
  });

  it('throws LeagueError NOT_FOUND when the league does not exist (and does not update or audit)', async () => {
    mockSelectOnce([]);

    await expect(setLeagueStatus(999, 'suspended', actor, meta)).rejects.toMatchObject({
      name: 'LeagueError',
      code: 'NOT_FOUND',
    });
    expect(updateSpy).not.toHaveBeenCalled();
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('throws LeagueError INVALID_TRANSITION for illegal transitions and does not touch DB', async () => {
    mockSelectOnce([{ ...fakeLeague, status: 'closed' }]);

    await expect(setLeagueStatus(12, 'active', actor, meta)).rejects.toMatchObject({
      name: 'LeagueError',
      code: 'INVALID_TRANSITION',
    });
    expect(updateSpy).not.toHaveBeenCalled();
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('rejects self-transitions (active -> active) without touching DB', async () => {
    mockSelectOnce([fakeLeague]);

    await expect(setLeagueStatus(12, 'active', actor, meta)).rejects.toMatchObject({
      code: 'INVALID_TRANSITION',
    });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('returns the updated league id and new status', async () => {
    mockSelectOnce([fakeLeague]);
    mockUpdateOnce();
    mockInsertOnce();

    const result = await setLeagueStatus(12, 'suspended', actor, meta);
    expect(result).toEqual({ leagueId: 12, status: 'suspended', slug: 'hkbankleague2026' });
  });
});
