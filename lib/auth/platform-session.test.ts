import { describe, expect, it } from 'vitest';
import { getValidatedPlatformAdminEmail } from './platform-session';

describe('getValidatedPlatformAdminEmail', () => {
  it('accepts an allow-listed platform admin session', () => {
    process.env.PLATFORM_ADMIN_EMAILS = 'admin@example.com';

    expect(
      getValidatedPlatformAdminEmail({
        email: ' Admin@Example.com ',
        role: 'admin',
        leagueId: 0,
        isPlatform: true,
      })
    ).toBe('admin@example.com');
  });

  it('rejects an allow-listed email without a platform admin session', () => {
    process.env.PLATFORM_ADMIN_EMAILS = 'admin@example.com';

    expect(
      getValidatedPlatformAdminEmail({
        email: 'admin@example.com',
        role: 'user',
        leagueId: 1,
        isPlatform: false,
      })
    ).toBeNull();
  });

  it('rejects a league admin session on the allow-list', () => {
    process.env.PLATFORM_ADMIN_EMAILS = 'admin@example.com';

    expect(
      getValidatedPlatformAdminEmail({
        email: 'admin@example.com',
        role: 'admin',
        leagueId: 1,
        isPlatform: false,
      })
    ).toBeNull();
  });
});
