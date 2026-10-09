import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectWhere = vi.fn();
const selectFrom = vi.fn(() => ({ where: selectWhere }));
const select = vi.fn(() => ({ from: selectFrom }));
const updateWhere = vi.fn();
const updateSet = vi.fn(() => ({ where: updateWhere }));
const update = vi.fn(() => ({ set: updateSet }));
const insertValues = vi.fn();
const insert = vi.fn(() => ({ values: insertValues }));
const sendMail = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    select,
    update,
    insert,
  },
}));

vi.mock('@/lib/api/rate-limit', () => ({
  getClientIp: () => '127.0.0.1',
  rateLimit: () => ({ allowed: true }),
}));

vi.mock('@/lib/mail/mailer', () => ({
  isMailConfigured: () => true,
  sendMail,
}));

vi.mock('@/lib/mail/templates', () => ({
  passwordResetEmail: () => ({
    subject: 'Reset password',
    html: '<p>reset</p>',
    text: 'reset',
  }),
}));

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    select.mockClear();
    selectFrom.mockClear();
    selectWhere.mockReset();
    update.mockClear();
    updateSet.mockClear();
    updateWhere.mockReset();
    insert.mockClear();
    insertValues.mockReset();
    sendMail.mockReset();

    selectWhere.mockResolvedValue([{ id: 42, username: 'captain' }]);
    updateWhere.mockResolvedValue(undefined);
    insertValues.mockResolvedValue(undefined);
    sendMail.mockResolvedValue(undefined);
  });

  it('revokes older unused reset tokens before issuing a new one', async () => {
    const { POST } = await import('@/app/api/auth/forgot-password/route');
    const response = await POST(
      new Request('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'captain@example.com' }),
      })
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledTimes(1);
  });
});
