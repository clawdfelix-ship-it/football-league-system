import { fail, ok } from '@/lib/api/response';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { db } from '@/lib/db';
import { passwordResetTokens, users } from '@/lib/schema';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { createHash } from 'crypto';

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

  const now = new Date();
  // 動態 import bcryptjs（同現有認證一致）
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await db.transaction(async (tx) => {
    // Atomically consume the token so concurrent requests cannot both succeed.
    const [consumed] = await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, now)
        )
      )
      .returning({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
        createdAt: passwordResetTokens.createdAt,
      });

    if (!consumed) {
      const [row] = await tx
        .select({
          usedAt: passwordResetTokens.usedAt,
          expiresAt: passwordResetTokens.expiresAt,
        })
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.tokenHash, tokenHash))
        .limit(1);

      if (!row) return { state: 'invalid' as const };
      if (row.usedAt) return { state: 'used' as const };
      if (new Date(row.expiresAt).getTime() <= now.getTime()) return { state: 'expired' as const };
      return { state: 'invalid' as const };
    }

    const [dbUser] = await tx
      .select({
        id: users.id,
        passwordChangedAt: users.passwordChangedAt,
      })
      .from(users)
      .where(eq(users.id, consumed.userId))
      .limit(1);

    if (!dbUser) return { state: 'invalid' as const };

    if (
      consumed.createdAt &&
      dbUser.passwordChangedAt &&
      new Date(dbUser.passwordChangedAt).getTime() > new Date(consumed.createdAt).getTime()
    ) {
      return { state: 'stale' as const };
    }

    await tx
      .update(users)
      .set({
        passwordHash,
        passwordChangedAt: now,
        mustChangePassword: null,
      })
      .where(eq(users.id, dbUser.id));

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(and(eq(passwordResetTokens.userId, dbUser.id), isNull(passwordResetTokens.usedAt)));

    return { state: 'ok' as const };
  });

  if (result.state === 'invalid') {
    return fail(400, 'INVALID_TOKEN', 'This reset link is invalid. Please request a new one.');
  }
  if (result.state === 'used') {
    return fail(400, 'TOKEN_USED', 'This reset link has already been used. Please request a new one.');
  }
  if (result.state === 'expired') {
    return fail(400, 'TOKEN_EXPIRED', 'This reset link has expired. Please request a new one.');
  }
  if (result.state === 'stale') {
    return fail(400, 'TOKEN_STALE', 'This reset link is no longer valid. Please request a new one.');
  }

  return ok({ message: 'Password updated. You can now sign in.' });
}
