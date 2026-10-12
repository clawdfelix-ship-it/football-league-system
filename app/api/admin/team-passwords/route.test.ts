import { beforeEach, describe, expect, it, vi } from 'vitest';

const getServerSession = vi.fn();
const getRequestLeagueId = vi.fn();
const hashPassword = vi.fn();
const sendMail = vi.fn();
const audit = vi.fn();

const selectWhere = vi.fn();
const selectFrom = vi.fn(() => ({ where: selectWhere }));
const select = vi.fn(() => ({ from: selectFrom }));
const updateWhere = vi.fn();
const updateSet = vi.fn(() => ({ where: updateWhere }));
const update = vi.fn(() => ({ set: updateSet }));

vi.mock('next-auth/next', () => ({
  getServerSession,
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/db', () => ({
  db: {
    select,
    update,
  },
}));

vi.mock('@/lib/tenant/context', () => ({
  getRequestLeagueId,
}));

vi.mock('@/lib/auth/password', () => ({
  hashPassword,
}));

vi.mock('@/lib/mail/mailer', () => ({
  sendMail,
}));

vi.mock('@/lib/auth/audit-log', () => ({
  audit,
}));

describe('PUT /api/admin/team-passwords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSession.mockResolvedValue({
      user: { role: 'admin', email: 'admin@example.com' },
    });
    getRequestLeagueId.mockResolvedValue(7);
    hashPassword.mockResolvedValue('hashed-password');
    selectWhere.mockResolvedValue([
      {
        id: 99,
        role: 'admin',
        username: 'league-admin',
        leagueId: 7,
      },
    ]);
    updateWhere.mockResolvedValue([]);
    sendMail.mockResolvedValue(undefined);
    audit.mockResolvedValue(undefined);
  });

  it('refuses to reset non-manager accounts', async () => {
    const { PUT } = await import('./route');
    const response = await PUT(
      new Request('http://localhost/api/admin/team-passwords', {
        method: 'PUT',
        body: JSON.stringify({ email: 'admin@example.com' }),
        headers: { 'content-type': 'application/json' },
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Only manager accounts can be reset by this endpoint',
      },
    });
    expect(update).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });
});
