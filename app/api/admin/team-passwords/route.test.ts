import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetServerSession,
  mockRateLimit,
  mockHashPassword,
  mockSendMail,
  mockAudit,
  mockEq,
  mockSelectWhere,
  mockUpdateWhere,
  mockDb,
} = vi.hoisted(() => {
  const selectWhere = vi.fn();
  const updateWhere = vi.fn();
  const selectFrom = vi.fn(() => ({ where: selectWhere }));
  const updateSet = vi.fn(() => ({ where: updateWhere }));

  return {
    mockGetServerSession: vi.fn(),
    mockRateLimit: vi.fn(),
    mockHashPassword: vi.fn(),
    mockSendMail: vi.fn(),
    mockAudit: vi.fn(),
    mockEq: vi.fn(),
    mockSelectWhere: selectWhere,
    mockUpdateWhere: updateWhere,
    mockSelectFrom: selectFrom,
    mockUpdateSet: updateSet,
    mockDb: {
      select: vi.fn(() => ({ from: selectFrom })),
      update: vi.fn(() => ({ set: updateSet })),
    },
  };
});

vi.mock('next-auth/next', () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/api/rate-limit', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
  rateLimit: mockRateLimit,
}));

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

vi.mock('@/lib/schema', () => ({
  users: {
    id: 'id',
    email: 'email',
    role: 'role',
    username: 'username',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: mockEq,
}));

vi.mock('@/lib/auth/password', () => ({
  hashPassword: mockHashPassword,
}));

vi.mock('@/lib/mail/mailer', () => ({
  sendMail: mockSendMail,
}));

vi.mock('@/lib/auth/audit-log', () => ({
  audit: mockAudit,
}));

import { PUT } from '@/app/api/admin/team-passwords/route';

describe('PUT /api/admin/team-passwords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockReturnValue({ allowed: true });
    mockGetServerSession.mockResolvedValue({
      user: { role: 'admin', email: 'admin@example.com' },
    });
    mockHashPassword.mockResolvedValue('hashed');
    mockSelectWhere.mockResolvedValue([
      { id: 1, role: 'manager', username: 'manager-user' },
    ]);
    mockUpdateWhere.mockResolvedValue(undefined);
    mockSendMail.mockResolvedValue(undefined);
    mockEq.mockReturnValue(Symbol('eq'));
  });

  it('does not return plaintextPassword when the reset email succeeds', async () => {
    const response = await PUT(
      new Request('http://localhost/api/admin/team-passwords', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'manager@example.com' }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.emailSent).toBe(true);
    expect(body.data).not.toHaveProperty('plaintextPassword');
  });

  it('returns plaintextPassword only as a manual fallback when email delivery fails', async () => {
    mockSendMail.mockRejectedValue(new Error('smtp offline'));

    const response = await PUT(
      new Request('http://localhost/api/admin/team-passwords', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'manager@example.com' }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.emailSent).toBe(false);
    expect(body.data.plaintextPassword).toMatch(/^[A-Z2-9]{3}(?:-[A-Z2-9]{3}){3}$/);
  });
});
