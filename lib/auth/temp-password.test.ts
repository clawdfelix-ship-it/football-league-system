import { describe, expect, it } from 'vitest';
import { generateTempPassword } from '@/lib/auth/temp-password';
import { PasswordSchema } from '@/lib/api/schemas';

describe('generateTempPassword', () => {
  it('produces the XXXX-XXXX-XXXX-XXXX grouped shape', () => {
    const pw = generateTempPassword();
    expect(pw).toMatch(/^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  });

  it('only uses the unambiguous alphabet (no 0/1/O/I)', () => {
    for (let i = 0; i < 200; i++) {
      const pw = generateTempPassword();
      expect(pw).not.toMatch(/[01OI]/);
    }
  });

  it('does not repeat across a large sample', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) seen.add(generateTempPassword());
    // ~62 bits of entropy: collisions in 5000 draws are vanishingly unlikely.
    expect(seen.size).toBe(5000);
  });
});

describe('PasswordSchema (unified policy)', () => {
  it('rejects passwords shorter than 8', () => {
    expect(() => PasswordSchema.parse('ab1')).toThrow();
  });

  it('rejects letters-only and digits-only passwords', () => {
    expect(() => PasswordSchema.parse('abcdefgh')).toThrow();
    expect(() => PasswordSchema.parse('12345678')).toThrow();
  });

  it('accepts an 8+ char password with a letter and a number', () => {
    expect(PasswordSchema.parse('abc12345')).toBe('abc12345');
  });
});
