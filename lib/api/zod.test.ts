import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { zodDetails } from '@/lib/api/zod';

describe('zodDetails', () => {
  it('returns undefined for non-ZodError', () => {
    expect(zodDetails(new Error('x'))).toBeUndefined();
  });

  it('maps issues for ZodError', () => {
    const schema = z.object({
      name: z.string().min(2),
      age: z.number().int().positive(),
    });

    try {
      schema.parse({ name: 'a', age: -1 });
      throw new Error('expected parse to throw');
    } catch (e) {
      expect(zodDetails(e)).toEqual([
        { path: 'name', message: expect.any(String) },
        { path: 'age', message: expect.any(String) },
      ]);
    }
  });
});
