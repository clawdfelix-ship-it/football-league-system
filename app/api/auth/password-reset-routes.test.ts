import { beforeEach, describe, expect, it, vi } from 'vitest';
import { passwordResetTokens, users } from '@/lib/schema';

const mocks = vi.hoisted(() => ({
  and: vi.fn((...conditions: unknown[]) => ({ op: 'and', conditions })),
  eq: vi.fn((left: unknown, right: unknown) => ({ op: 'eq', left, right })),
  isNull: vi.fn((column: unknown) => ({ op: 'isNull', column })),
  getClientIp: vi.fn(() => '127.0.0.1'),
  rateLimit: vi.fn(() => ({ allowed: true })),
  selectResult: [] as unknown[],
  txUpdateCalls: [] as Array<{ table: unknown; values: unknown; condition: unknown }>,
  txInsertCalls: [] as Array<{ table: unknown; values: unknown }>,
  session: null as
    | null
    | {
        user?: {
          email?: string | null;
          role?: string | null;
          mustChangePassword?: boolean | null;
        };
      },
  sendMail: vi.fn(),
  isMailConfigured: vi.fn(() => true),
  passwordResetEmail: vi.fn(() => ({
    subject: 'Reset your password',
    html: '<p>reset</p>',
    text: 'reset',
  })),
  hash: vi.fn(),
  compare: vi.fn(),
  hashPassword: vi.fn(),
  audit: vi.fn(),
}));

vi.mock('drizzle-orm', () => ({
  and: mocks.and,
  eq: mocks.eq,
  isNull: mocks.isNull,
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

vi.mock('@/lib/mail/mailer', () => ({
  isMailConfigured: mocks.isMailConfigured,
  sendMail: mocks.sendMail,
}));

vi.mock('@/lib/mail/templates', () => ({
  passwordResetEmail: mocks.passwordResetEmail,
}));

vi.mock('@/lib/auth/password', () => ({
  hashPassword: mocks.hashPassword,
}));

vi.mock('@/lib/auth/audit-log', () => ({
  audit: mocks.audit,
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: mocks.compare,
  },
  compare: mocks.compare,
  hash: mocks.hash,
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => mocks.selectResult),
      })),
    })),
    transaction: vi.fn(async (callback: (tx: {
      update: (table: unknown) => {
        set: (values: unknown) => {
          where: (condition: unknown) => Promise<void>;
        };
      };
      insert: (table: unknown) => {
        values: (values: unknown) => Promise<void>;
      };
    }) => Promise<unknown>) => {
      mocks.txUpdateCalls.length = 0;
      mocks.txInsertCalls.length = 0;

      const tx = {
        update: (table: unknown) => ({
          set: (values: unknown) => ({
            where: async (condition: unknown) => {
              mocks.txUpdateCalls.push({ table, values, condition });
            },
          }),
        }),
        insert: (table: unknown) => ({
          values: async (values: unknown) => {
            mocks.txInsertCalls.push({ table, values });
          },
        }),
      };

      return callback(tx);
    }),
  },
}));

import { POST as changePasswordPost } from '@/app/api/auth/change-password/route';
import { POST as forgotPasswordPost } from '@/app/api/auth/forgot-password/route';
import { POST as resetPasswordPost } from '@/app/api/auth/reset-password/route';

describe('password reset hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectResult = [];
    mocks.txUpdateCalls.length = 0;
    mocks.txInsertCalls.length = 0;
    mocks.session = null;
    mocks.isMailConfigured.mockReturnValue(true);
    mocks.rateLimit.mockReturnValue({ allowed: true });
    mocks.sendMail.mockResolvedValue(undefined);
    mocks.hash.mockResolvedValue('hashed-with-bcrypt');
    mocks.compare.mockResolvedValue(true);
    mocks.hashPassword.mockResolvedValue('hashed-password');
  });

  it('revokes prior reset tokens before issuing a new forgot-password link', async () => {
    mocks.selectResult = [{ id: 42, username: 'captain' }];

    const response = await forgotPasswordPost(
      new Request('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'captain@example.com' }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.txUpdateCalls).toHaveLength(1);
    expect(mocks.txUpdateCalls[0]).toMatchObject({
      table: passwordResetTokens,
      condition: {
        op: 'and',
        conditions: [
          { op: 'eq', left: passwordResetTokens.userId, right: 42 },
          { op: 'isNull', column: passwordResetTokens.usedAt },
        ],
      },
    });
    expect(mocks.txInsertCalls).toHaveLength(1);
    expect(mocks.txInsertCalls[0]).toMatchObject({
      table: passwordResetTokens,
      values: expect.objectContaining({
        userId: 42,
        tokenHash: expect.any(String),
      }),
    });
  });

  it('marks every active reset token used after a successful password reset', async () => {
    mocks.selectResult = [
      {
        id: 7,
        userId: 99,
        usedAt: null,
        expiresAt: new Date(Date.now() + 30_000),
      },
    ];

    const response = await resetPasswordPost(
      new Request('http://localhost/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'a'.repeat(64),
          password: 'Password123',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.txUpdateCalls).toHaveLength(2);
    expect(mocks.txUpdateCalls[0].table).toBe(users);
    expect(mocks.txUpdateCalls[1]).toMatchObject({
      table: passwordResetTokens,
      condition: {
        op: 'and',
        conditions: [
          { op: 'eq', left: passwordResetTokens.userId, right: 99 },
          { op: 'isNull', column: passwordResetTokens.usedAt },
        ],
      },
    });
  });

  it('revokes outstanding reset links after an authenticated password change', async () => {
    mocks.session = {
      user: {
        email: 'manager@example.com',
        role: 'manager',
        mustChangePassword: false,
      },
    };
    mocks.selectResult = [
      {
        id: 55,
        role: 'manager',
        passwordHash: 'stored-hash',
      },
    ];

    const response = await changePasswordPost(
      new Request('http://localhost/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'Oldpass123',
          newPassword: 'Newpass123',
        }),
        headers: { 'content-type': 'application/json' },
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.txUpdateCalls).toHaveLength(2);
    expect(mocks.txUpdateCalls[0].table).toBe(users);
    expect(mocks.txUpdateCalls[1]).toMatchObject({
      table: passwordResetTokens,
      condition: {
        op: 'and',
        conditions: [
          { op: 'eq', left: passwordResetTokens.userId, right: 55 },
          { op: 'isNull', column: passwordResetTokens.usedAt },
        ],
      },
    });
  });
});
