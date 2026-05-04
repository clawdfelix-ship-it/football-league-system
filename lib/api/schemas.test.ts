import { describe, expect, it } from 'vitest';
import { ChangePasswordSchema, CreateMatchSchema, RegisterSchema } from '@/lib/api/schemas';

describe('CreateMatchSchema', () => {
  it('requires date when status is scheduled/finished', () => {
    expect(() =>
      CreateMatchSchema.parse({
        homeTeam: 'A',
        awayTeam: 'B',
        status: 'scheduled',
      })
    ).toThrow();
  });

  it('allows missing date when status is tbc', () => {
    const value = CreateMatchSchema.parse({
      homeTeam: 'A',
      awayTeam: 'B',
      status: 'tbc',
    });
    expect(value.status).toBe('tbc');
  });
});

describe('RegisterSchema', () => {
  it('rejects invalid email', () => {
    expect(() =>
      RegisterSchema.parse({
        email: 'not-an-email',
        username: 'user',
        password: '123456',
      })
    ).toThrow();
  });
});

describe('ChangePasswordSchema', () => {
  it('requires min length 8 for new password', () => {
    expect(() =>
      ChangePasswordSchema.parse({
        currentPassword: 'old',
        newPassword: 'short',
      })
    ).toThrow();
  });
});
