import { ok, fail } from '@/lib/api/response';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import { passwordResetTokens } from '@/lib/schema';
import { sendMail, isMailConfigured } from '@/lib/mail/mailer';
import { passwordResetEmail } from '@/lib/mail/templates';

const EXPIRES_MINUTES = 30;

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function buildResetUrl(rawToken: string): string {
  const base = process.env.APP_BASE_URL || 'https://football-league-system-zenex.vercel.app';
  return `${base.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // 嚴格限流，防掃 email / 濫發
  const rl = rateLimit(`pw-forgot:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) return fail(429, 'RATE_LIMITED', 'Too many requests. Please try again later.');

  let email = '';
  try {
    const body = await request.json();
    email = String(body.email || '').toLowerCase().trim();
  } catch {
    return fail(400, 'VALIDATION_ERROR', 'Invalid request body');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail(400, 'VALIDATION_ERROR', 'A valid email is required');
  }

  if (!isMailConfigured()) {
    // 唔好向匿名用戶披露伺服器配置，但要記低
    console.error('Password reset requested but SMTP is not configured');
    return fail(503, 'MAIL_UNAVAILABLE', 'Password reset is temporarily unavailable. Please contact the administrator.');
  }

  // 不論帳號存在與否都回傳相同訊息，防被用嚟探測邊個 email 有註冊
  const genericSuccess = ok({ message: 'If the account exists, a reset email has been sent.' });

  const [dbUser] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.email, email));

  if (!dbUser) {
    return genericSuccess;
  }

  try {
    // 生 raw token（只經 email 送出一次），DB 只存 SHA-256 hash
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + EXPIRES_MINUTES * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId: dbUser.id,
      tokenHash,
      expiresAt,
    });

    const url = buildResetUrl(rawToken);
    const msg = passwordResetEmail({
      name: null,
      url,
      expiresMinutes: EXPIRES_MINUTES,
    });

    await sendMail({
      to: email,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });
  } catch (e) {
    console.error('Failed to send password reset email:', e);
    return fail(500, 'MAIL_FAILED', 'Could not send the reset email. Please try again later.');
  }

  return genericSuccess;
}
