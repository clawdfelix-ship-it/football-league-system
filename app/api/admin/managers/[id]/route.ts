import { ok, fail } from '@/lib/api/response';
import { getAuthContext } from '@/lib/authz';
import { getRequestLeagueId } from '@/lib/tenant/context';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { audit } from '@/lib/auth/audit-log';
import { hashPassword } from '@/lib/auth/password';
import { generateTempPassword } from '@/lib/auth/temp-password';
import { sendMail } from '@/lib/mail/mailer';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** POST: reset a manager's password. Returns the new temp password ONCE. */
export async function POST(request: Request, context: Params) {
  const ip = getClientIp(request);
  const rl = rateLimit(`manager-reset:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) return fail(429, 'RATE_LIMITED', 'Too many requests');

  try {
    const auth = await getAuthContext();
    if (!auth) return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
    if (auth.role !== 'admin') return fail(403, 'FORBIDDEN', 'League admin access required');

    const leagueId = await getRequestLeagueId();
    if (auth.leagueId !== leagueId) return fail(403, 'FORBIDDEN', 'Cross-league access denied');

    const { id } = await context.params;
    const managerId = Number(id);
    if (!Number.isInteger(managerId) || managerId <= 0) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid manager id');
    }

    // Verify target is a manager in this league
    const [target] = await db
      .select({ id: users.id, email: users.email, teamId: users.teamId })
      .from(users)
      .where(and(eq(users.id, managerId), eq(users.leagueId, leagueId), eq(users.role, 'manager')))
      .limit(1);

    if (!target) return fail(404, 'NOT_FOUND', '搵唔到呢個 manager');

    const newPassword = generateTempPassword();
    const passwordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ passwordHash, mustChangePassword: new Date() })
      .where(eq(users.id, managerId));

    void audit({
      action: 'admin.manager.reset_password',
      actor: { role: 'admin', email: auth.email ?? null, username: auth.username ?? null },
      ip,
      result: 'success',
      detail: `reset password for manager id=${managerId} email=${target.email}`,
    });

    // Best-effort email
    try {
      const h = await headers();
      const host = h.get('host');
      const loginUrl = host ? `https://${host}/login` : '/login';
      await sendMail({
        to: target.email,
        subject: '你嘅 Zenex Sports League 密碼已重設',
        text: `你嘅密碼已被管理員重設。

登入電郵：${target.email}
新臨時密碼：${newPassword}
登入：${loginUrl}

首次登入後請即更改密碼。`,
        html: `<p>你嘅密碼已被管理員重設。</p><p><strong>登入電郵：</strong>${target.email}<br/><strong>新臨時密碼：</strong><code>${newPassword}</code></p><p><a href="${loginUrl}">立即登入</a></p><p>首次登入後請即更改密碼。</p>`,
      });
    } catch (mailErr) {
      console.warn('[managers] reset email failed (non-blocking):', mailErr);
    }

    return ok({ managerId, tempPassword: newPassword });
  } catch (e) {
    console.error('[managers] reset POST unexpected error:', e);
    return fail(500, 'INTERNAL_ERROR', 'Unexpected server error');
  }
}

/** DELETE: remove a manager account (admin only). */
export async function DELETE(request: Request, context: Params) {
  const ip = getClientIp(request);
  const rl = rateLimit(`manager-delete:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) return fail(429, 'RATE_LIMITED', 'Too many requests');

  try {
    const auth = await getAuthContext();
    if (!auth) return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
    if (auth.role !== 'admin') return fail(403, 'FORBIDDEN', 'League admin access required');

    const leagueId = await getRequestLeagueId();
    if (auth.leagueId !== leagueId) return fail(403, 'FORBIDDEN', 'Cross-league access denied');

    const { id } = await context.params;
    const managerId = Number(id);
    if (!Number.isInteger(managerId) || managerId <= 0) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid manager id');
    }

    const [target] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(and(eq(users.id, managerId), eq(users.leagueId, leagueId), eq(users.role, 'manager')))
      .limit(1);

    if (!target) return fail(404, 'NOT_FOUND', '搵唔到呢個 manager');

    await db.delete(users).where(eq(users.id, managerId));

    void audit({
      action: 'admin.manager.delete',
      actor: { role: 'admin', email: auth.email ?? null, username: auth.username ?? null },
      ip,
      result: 'success',
      detail: `deleted manager id=${managerId} email=${target.email}`,
    });

    return ok({ deleted: managerId });
  } catch (e) {
    console.error('[managers] DELETE unexpected error:', e);
    return fail(500, 'INTERNAL_ERROR', 'Unexpected server error');
  }
}
