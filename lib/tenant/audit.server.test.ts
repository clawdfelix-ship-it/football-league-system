import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.hoisted ensures the spy exists before the hoisted vi.mock factory runs.
const { insertSpy } = vi.hoisted(() => ({ insertSpy: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: {
    insert: insertSpy,
  },
}));

import { recordPlatformEvent } from './audit.server';

describe('recordPlatformEvent', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    insertSpy.mockReset();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('inserts one row with all fields mapped to snake_case columns', async () => {
    const valuesSpy = vi.fn().mockResolvedValue(undefined);
    insertSpy.mockReturnValue({ values: valuesSpy });

    await recordPlatformEvent({
      actorEmail: 'admin@example.com',
      actorUserId: 7,
      action: 'league.suspend',
      targetType: 'league',
      targetId: 12,
      targetLabel: 'hkbankleague2026',
      metadata: { from: 'active', to: 'suspended' },
      ip: '1.2.3.4',
      userAgent: 'Mozilla/5.0',
    });

    expect(insertSpy).toHaveBeenCalledTimes(1);
    expect(valuesSpy).toHaveBeenCalledTimes(1);
    const arg = valuesSpy.mock.calls[0][0];
    expect(arg).toMatchObject({
      actorEmail: 'admin@example.com',
      actorUserId: 7,
      action: 'league.suspend',
      targetType: 'league',
      targetId: 12,
      targetLabel: 'hkbankleague2026',
      metadata: { from: 'active', to: 'suspended' },
      ip: '1.2.3.4',
      userAgent: 'Mozilla/5.0',
    });
  });

  it('defaults optional fields to null / empty object when omitted', async () => {
    const valuesSpy = vi.fn().mockResolvedValue(undefined);
    insertSpy.mockReturnValue({ values: valuesSpy });

    await recordPlatformEvent({
      actorEmail: 'admin@example.com',
      action: 'application.approve',
      targetType: 'application',
    });

    const arg = valuesSpy.mock.calls[0][0];
    expect(arg.actorUserId).toBeNull();
    expect(arg.targetId).toBeNull();
    expect(arg.targetLabel).toBeNull();
    expect(arg.metadata).toEqual({});
    expect(arg.ip).toBeNull();
    expect(arg.userAgent).toBeNull();
  });

  it('does not throw when the DB insert fails — audit failure must not block the action', async () => {
    const valuesSpy = vi.fn().mockRejectedValue(new Error('connection reset'));
    insertSpy.mockReturnValue({ values: valuesSpy });

    await expect(
      recordPlatformEvent({
        actorEmail: 'admin@example.com',
        action: 'league.suspend',
        targetType: 'league',
        targetId: 12,
      })
    ).resolves.toBeUndefined();

    // ...but the failure IS logged so we can see it in Vercel logs.
    expect(errorSpy).toHaveBeenCalled();
    const logged = errorSpy.mock.calls.flat().join(' ');
    expect(logged).toMatch(/league\.suspend/);
  });

  it('does not throw even if db.insert itself throws synchronously', async () => {
    insertSpy.mockImplementation(() => {
      throw new Error('no DATABASE_URL');
    });

    await expect(
      recordPlatformEvent({
        actorEmail: 'admin@example.com',
        action: 'league.reactivate',
        targetType: 'league',
        targetId: 1,
      })
    ).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });
});
