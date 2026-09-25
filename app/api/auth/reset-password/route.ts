import { fail, ok } from '@/lib/api/response';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { db } from '@/lib/db';
import { passwordResetTokens, users } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { createHash } from 'crypto';

const EXPIRES_MS = 30 * 60 * 1000;
const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`pw-reset:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) return fail(429, 'RATE_LIMITED', 'Too many requests. Please try again later.');

  let token = '';
  let password = '';
  try {
    const body = await request.json();
    token = String(body.token || '').trim();
    password = String(body.password || '');
  } catch {
    return fail(400, 'VALIDATION_ERROR', 'Invalid request body');
  }

  if (!token || token.length !== 64) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid or missing token');
  }
  if (password.length < MIN_LENGTH || password.length > MAX_LENGTH) {
    return fail(400, 'VALIDATION_ERROR', `Password must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`);
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return fail(400, 'VALIDATION_ERROR', 'Password must contain both letters and numbers');
  }

  const tokenHash = hashToken(token);

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash)));

  if (!row) {
    return fail(400, 'INVALID_TOKEN', 'This reset link is invalid. Please request a new one.');
  }
  if (row.usedAt) {
    return fail(400, 'TOKEN_USED', 'This reset link has already been used. Please request a new one.');
  }
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    return fail(400, 'TOKEN_EXPIRED', 'This reset link has expired. Please request a new one.');
  }

  const now = new Date();
  // 動態 import bcryptjs（同現有認證一致）
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash(password, 10);

  // 交易：更新密碼 + 標記 token 已用 + 清除 must_change_password（因為用戶自己設咗新密）
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash,
        passwordChangedAt: now,
        mustChangePassword: null,
      })
      .where(eq(users.id, row.userId));

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(eq(passwordResetTokens.id, row.id));
  });

  return ok({ message: 'Password updated. You can now sign in.' });
}
