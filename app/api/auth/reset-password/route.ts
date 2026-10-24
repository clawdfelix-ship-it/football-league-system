import { fail, ok } from '@/lib/api/response';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { db } from '@/lib/db';
import { passwordResetTokens, users } from '@/lib/schema';
import { and, eq, isNull, ne } from 'drizzle-orm';
import { createHash } from 'crypto';
import { hashPassword } from '@/lib/auth/password';
import { resolveLeagueIdForRequest } from '@/lib/tenant/request-league';

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

  // The token is strictly single-tenant: the host league must match the
  // league the token was issued for. Platform/unknown host (lid <= 0) is
  // rejected outright (fail-closed; audit F7/P2-1).
  const lid = await resolveLeagueIdForRequest(request);
  if (lid <= 0) {
    return fail(400, 'INVALID_TOKEN', 'This reset link is invalid. Please request a new one.');
  }

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash));

  if (!row) {
    return fail(400, 'INVALID_TOKEN', 'This reset link is invalid. Please request a new one.');
  }
  if (row.leagueId !== lid) {
    // Token belongs to another league/host, or is a platform-host token.
    // Treat as invalid, do not reveal more.
    return fail(400, 'INVALID_TOKEN', 'This reset link is invalid. Please request a new one.');
  }
  if (row.usedAt) {
    return fail(400, 'TOKEN_USED', 'This reset link has already been used. Please request a new one.');
  }
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    return fail(400, 'TOKEN_EXPIRED', 'This reset link has expired. Please request a new one.');
  }

  const now = new Date();
  const passwordHash = await hashPassword(password);

  // NOTE: drizzle-orm/neon-http has no interactive db.transaction() (it throws
  // "No transactions support in neon-http driver"). These two updates are
  // independent one-row statements; the token is single-use and verified above,
  // so run them sequentially. Worst case (crash between them) the same token can
  // be replayed once, which simply re-applies the caller's own new password.
  await db
    .update(users)
    .set({
      passwordHash,
      passwordChangedAt: now,
      mustChangePassword: null,
    })
    .where(and(eq(users.id, row.userId), eq(users.leagueId, row.leagueId ?? lid)));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(eq(passwordResetTokens.id, row.id));

  // Invalidate any other unused tokens for the same user so an older reset
  // email can't be replayed after the password was changed (audit F7).
  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(passwordResetTokens.userId, row.userId),
        ne(passwordResetTokens.id, row.id),
        isNull(passwordResetTokens.usedAt)
      )
    );

  return ok({ message: 'Password updated. You can now sign in.' });
}
