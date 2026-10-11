import { describe, expect, it } from 'vitest';
import { DEFAULT_LEAGUE_ID } from './config';
import { isLeagueMemberOrLegacyDefault } from './legacy-default-league';

describe('isLeagueMemberOrLegacyDefault', () => {
  it('treats NULL league bindings as the founding league', () => {
    expect(isLeagueMemberOrLegacyDefault(null, DEFAULT_LEAGUE_ID)).toBe(true);
    expect(isLeagueMemberOrLegacyDefault(undefined, DEFAULT_LEAGUE_ID)).toBe(true);
  });

  it('accepts explicit matches in any league', () => {
    expect(isLeagueMemberOrLegacyDefault(DEFAULT_LEAGUE_ID, DEFAULT_LEAGUE_ID)).toBe(true);
    expect(isLeagueMemberOrLegacyDefault(7, 7)).toBe(true);
  });

  it('rejects cross-league matches', () => {
    expect(isLeagueMemberOrLegacyDefault(7, DEFAULT_LEAGUE_ID)).toBe(false);
    expect(isLeagueMemberOrLegacyDefault(null, 7)).toBe(false);
    expect(isLeagueMemberOrLegacyDefault(3, 7)).toBe(false);
  });
});
