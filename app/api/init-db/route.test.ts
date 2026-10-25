import { describe, expect, it } from 'vitest';
import { hasTableRegistration } from './route';

describe('hasTableRegistration', () => {
  it('returns false when to_regclass reports a missing table', () => {
    expect(hasTableRegistration({ rows: [{ leagues: null }] }, 'leagues')).toBe(false);
  });

  it('returns true when the table is present', () => {
    expect(hasTableRegistration({ rows: [{ leagues: 'leagues' }] }, 'leagues')).toBe(true);
  });
});
