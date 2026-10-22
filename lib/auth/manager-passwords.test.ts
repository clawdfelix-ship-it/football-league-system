import { describe, expect, it } from 'vitest';
import { canManageManagerPassword } from './manager-passwords';

describe('canManageManagerPassword', () => {
  it('allows a manager in the same league', () => {
    expect(
      canManageManagerPassword({ role: 'manager', leagueId: 7 }, 7)
    ).toBe(true);
  });

  it('rejects a non-manager in the same league', () => {
    expect(
      canManageManagerPassword({ role: 'admin', leagueId: 7 }, 7)
    ).toBe(false);
    expect(
      canManageManagerPassword({ role: 'user', leagueId: 7 }, 7)
    ).toBe(false);
  });

  it('rejects a manager from another league', () => {
    expect(
      canManageManagerPassword({ role: 'manager', leagueId: 9 }, 7)
    ).toBe(false);
  });
});
