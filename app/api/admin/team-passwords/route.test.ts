import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  eq: vi.fn((left: unknown, right: unknown) => ({ op: 'eq', left, right })),
  getClientIp: vi.fn(() => '127.0.0.1'),
  rateLimit: vi.fn(() => ({ allowed: true })),
  session: {
    user: {
      email: 'admin@example.com',
      role: 'admin',
    },
  } as
    | null
    | {
        user?: {
          email?: string | null;
          role?: string | null;
        };
      },
  selectResult: [] as unknown[],
  updateWhere: vi.fn(),
  hashPassword: vi.fn(),
  audit: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock('drizzle-orm', () => ({
  eq: mocks.eq,
}));

vi.mock('@/lib/api/rate-limit', () => ({
  getClientIp: mocks.getClientIp,
  rateLimit: mocks.rateLimit,
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(async () => mocks.session),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/auth/password', () => ({
  hashPassword: mocks.hashPassword,
}));

vi.mock('@/lib/auth/audit-log', () => ({
  audit: mocks.audit,
}));

vi.mock('@/lib/mail/mailer', () => ({
  sendMail: mocks.sendMail,
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => mocks.selectResult),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: mocks.updateWhere,
      })),
    })),
    insert: vi.fn(),
  },
}));

import { PUT } from '@/app/api/admin/team-passwords/route';

describe('PUT /api/admin/team-passwords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session = {
      user: {
        email: 'admin@example.com',
        role: 'admin',
      },
    };
    mocks.selectResult = [];
    mocks.rateLimit.mockReturnValue({ allowed: true });
    mocks.hashPassword.mockResolvedValue('hashed-password');
    mocks.sendMail.mockResolvedValue(undefined);
  });

  it('rejects resetting a non-manager account', async () => {
    mocks.selectResult = [
      {
        id: 7,
        role: 'admin',
        username: 'root',
      },
    ];

    const response = await PUT(
      new Request('http://localhost/api/admin/team-passwords', {
        method: 'PUT',
        body: JSON.stringify({ email: 'admin@example.com' }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: 'ROLE_CONFLICT',
      },
    });
    expect(mocks.updateWhere).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
});
