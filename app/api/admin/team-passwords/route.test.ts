import { beforeEach, describe, expect, it, vi } from 'vitest';

const { selectSpy } = vi.hoisted(() => ({
  selectSpy: vi.fn(),
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => ({
    user: { role: 'admin', email: 'admin@example.com' },
  })),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: selectSpy,
  },
}));

vi.mock('@/lib/api/rate-limit', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
  rateLimit: vi.fn(() => ({ allowed: true })),
}));

vi.mock('@/lib/tenant/context', () => ({
  getRequestLeagueId: vi.fn(async () => 1),
}));

vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn(async () => 'hashed-password'),
}));

vi.mock('@/lib/auth/temp-password', () => ({
  generateTempPassword: vi.fn(() => 'TEMP-1234'),
}));

vi.mock('@/lib/auth/audit-log', () => ({
  audit: vi.fn(async () => undefined),
}));

vi.mock('@/lib/mail/mailer', () => ({
  sendMail: vi.fn(async () => undefined),
}));

import { POST } from './route';

describe('POST /api/admin/team-passwords', () => {
  beforeEach(() => {
    selectSpy.mockReset();
  });

  it('rejects a mismatched team row instead of resetting the first team in the league', async () => {
    const limitSpy = vi.fn().mockResolvedValue([
      {
        id: 1,
        name: 'HSBC',
        shortName: 'HSBC',
      },
    ]);
    const whereSpy = vi.fn().mockReturnValue({ limit: limitSpy });
    const fromSpy = vi.fn().mockReturnValue({ where: whereSpy });
    selectSpy.mockReturnValueOnce({ from: fromSpy });

    const response = await POST(
      new Request('http://localhost/api/admin/team-passwords', {
        method: 'POST',
        body: JSON.stringify({
          team: 'BBVA',
          password: 'Pass1234',
        }),
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Unknown team: BBVA' },
    });
  });
});
