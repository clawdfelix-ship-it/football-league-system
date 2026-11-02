import { describe, expect, it } from 'vitest';
import { byDateDesc, byUpcomingDate } from './fixture-ordering';

const fixture = (id: number, date: string | null) => ({ id, date });

describe('fixture ordering', () => {
  it('orders upcoming fixtures soonest first, including invalid and null dates last', () => {
    const fixtures = [
      fixture(4, null),
      fixture(3, '2026-12-01T12:00:00Z'),
      fixture(2, '2026-11-03T12:00:00Z'),
      fixture(1, '2026-11-02T12:00:00Z'),
      fixture(5, 'not-a-date'),
    ];

    expect(fixtures.slice().sort(byUpcomingDate).map((match) => match.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps results newest first', () => {
    const fixtures = [
      fixture(1, '2026-11-02T12:00:00Z'),
      fixture(3, '2026-12-01T12:00:00Z'),
      fixture(2, '2026-11-03T12:00:00Z'),
    ];

    expect(fixtures.slice().sort(byDateDesc).map((match) => match.id)).toEqual([3, 2, 1]);
  });
});
