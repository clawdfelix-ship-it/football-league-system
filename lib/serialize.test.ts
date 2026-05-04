import { describe, expect, it } from 'vitest';
import { iso } from '@/lib/serialize';

describe('iso', () => {
  it('returns null for falsy values', () => {
    expect(iso(null)).toBeNull();
    expect(iso(undefined)).toBeNull();
    expect(iso('')).toBeNull();
  });

  it('returns string as-is', () => {
    expect(iso('2026-01-01T00:00:00.000Z')).toBe('2026-01-01T00:00:00.000Z');
  });

  it('serializes Date to ISO string', () => {
    const d = new Date('2026-01-01T00:00:00.000Z');
    expect(iso(d)).toBe('2026-01-01T00:00:00.000Z');
  });
});

