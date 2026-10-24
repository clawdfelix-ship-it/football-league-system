import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';

const { insertSpy, selectSpy, updateSpy } = vi.hoisted(() => ({
  insertSpy: vi.fn(),
  selectSpy: vi.fn(),
  updateSpy: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: { insert: insertSpy, select: selectSpy, update: updateSpy },
}));

import {
  mintImpersonateToken,
  redeemImpersonateToken,
  ImpersonateError,
  IMPERSONATE_TTL_MS,
  hashImpersonateToken,
} from './impersonate.server';

describe('hashImpersonateToken', () => {
  it('produces a deterministic sha256 hex digest', () => {
    const h = hashImpersonateToken('abc');
    expect(h).toMatch(/^[a-f0-9]{64}$/);
    expect(h).toBe(crypto.createHash('sha256').update('abc').digest('hex'));
  });
});

describe('mintImpersonateToken', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    insertSpy.mockReset();
    selectSpy.mockReset();
    updateSpy.mockReset();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('inserts a row and returns the plaintext token + expiresAt', async () => {
    // League exists check
    const limitSpy = vi.fn().mockResolvedValue([{ id: 1, slug: 'x' }]);
    const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValueOnce({ from: fromSpy });

    const valuesSpy = vi.fn().mockResolvedValue(undefined);
    insertSpy.mockReturnValueOnce({ values: valuesSpy });

    const result = await mintImpersonateToken(1, 'admin@x.com');

    expect(result.token).toMatch(/^[a-f0-9]{64}$/); // random hex
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.expiresAt.getTime() - Date.now()).toBeGreaterThan(IMPERSONATE_TTL_MS - 5000);

    const insertArg = valuesSpy.mock.calls[0][0];
    expect(insertArg.tokenHash).toBe(hashImpersonateToken(result.token));
    expect(insertArg.leagueId).toBe(1);
    expect(insertArg.platformAdminEmail).toBe('admin@x.com');
  });

  it('throws NOT_FOUND when league does not exist', async () => {
    const limitSpy = vi.fn().mockResolvedValue([]);
    const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValueOnce({ from: fromSpy });

    await expect(mintImpersonateToken(999, 'admin@x.com')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('redeemImpersonateToken', () => {
  beforeEach(() => {
    insertSpy.mockReset();
    selectSpy.mockReset();
    updateSpy.mockReset();
  });

  function mockSelectTokenOnce(rows: unknown[]) {
    const limitSpy = vi.fn().mockResolvedValue(rows);
    const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValueOnce({ from: fromSpy });
  }

  function mockUpdateOnce() {
    const whereSpy = vi.fn().mockResolvedValue(undefined);
    const setSpy = vi.fn().mockReturnValue({ where: whereSpy });
    updateSpy.mockReturnValueOnce({ set: setSpy });
    return { setSpy };
  }

  it('redeems a valid token: marks used and returns league + admin email', async () => {
    const token = 'a'.repeat(64);
    const futureExpiry = new Date(Date.now() + 60_000);
    mockSelectTokenOnce([
      {
        id: 7,
        leagueId: 1,
        platformAdminEmail: 'admin@x.com',
        expiresAt: futureExpiry,
        usedAt: null,
      },
    ]);
    const { setSpy } = mockUpdateOnce();

    const result = await redeemImpersonateToken(token);

    expect(result).toEqual({ leagueId: 1, platformAdminEmail: 'admin@x.com' });
    const setArg = setSpy.mock.calls[0][0];
    expect(setArg.usedAt).toBeInstanceOf(Date);
  });

  it('rejects unknown token with INVALID_TOKEN', async () => {
    mockSelectTokenOnce([]);
    await expect(redeemImpersonateToken('x'.repeat(64))).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
    });
  });

  it('rejects expired token with TOKEN_EXPIRED', async () => {
    mockSelectTokenOnce([
      {
        id: 7,
        leagueId: 1,
        platformAdminEmail: 'admin@x.com',
        expiresAt: new Date(Date.now() - 1000), // past
        usedAt: null,
      },
    ]);
    await expect(redeemImpersonateToken('b'.repeat(64))).rejects.toMatchObject({
      code: 'TOKEN_EXPIRED',
    });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('rejects already-used token with TOKEN_USED (single-use)', async () => {
    mockSelectTokenOnce([
      {
        id: 7,
        leagueId: 1,
        platformAdminEmail: 'admin@x.com',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: new Date(),
      },
    ]);
    await expect(redeemImpersonateToken('c'.repeat(64))).rejects.toMatchObject({
      code: 'TOKEN_USED',
    });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('is an ImpersonateError instance on failure', async () => {
    mockSelectTokenOnce([]);
    try {
      await redeemImpersonateToken('d'.repeat(64));
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ImpersonateError);
    }
  });
});
