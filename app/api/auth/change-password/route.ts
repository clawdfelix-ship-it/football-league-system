import { ok, fail } from '@/lib/api/response';
import { ChangePasswordSchema } from '@/lib/api/schemas';
import { zodDetails } from '@/lib/api/zod';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth/password';
import { audit } from '@/lib/auth/audit-log';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
  }

  const role = session.user?.role;
  if (role !== 'manager' && role !== 'user') {
    return fail(403, 'FORBIDDEN', 'Only managers and users can change their own password');
  }

  const email = String(session.user.email).toLowerCase();
  const isForced = Boolean(session.user?.mustChangePassword);

  const ip = getClientIp(request);
  const rl = rateLimit(`change-password:${ip}:${email}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) return fail(429, 'RATE_LIMITED', 'Too many requests');

  // First-change flow: only newPassword + confirm required.
  // Self-service flow: requires currentPassword + newPassword.
  let input: { currentPassword?: string; newPassword: string; confirmPassword?: string };
  try {
    const raw = await request.json();
    if (isForced) {
      const { ChangePasswordFirstTimeSchema } = await import('@/lib/api/schemas');
      input = ChangePasswordFirstTimeSchema.parse(raw);
    } else {
      input = ChangePasswordSchema.parse(raw);
    }
  } catch (e) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid request body', zodDetails(e));
  }

  const [dbUser] = await db
    .select({
      id: users.id,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email));

  if (!dbUser) {
    return fail(404, 'NOT_FOUND', 'Account not found');
  }

  if (!isForced) {
    if (!input.currentPassword) {
      return fail(400, 'VALIDATION_ERROR', 'currentPassword is required');
    }
    const okPw = await (await import('bcryptjs')).default.compare(input.currentPassword, dbUser.passwordHash);
    if (!okPw) {
      void audit({
        action: 'admin.manager_account.generate', // reuse audit category
        actor: { role: dbUser.role as 'admin' | 'manager' | 'user', email, username: null },
        ip,
        result: 'denied',
        detail: 'change-password: wrong current password',
      });
      return fail(400, 'INVALID_CREDENTIALS', 'Current password is incorrect');
    }
  }

  // Reject setting the same password as the current one (only meaningful for
  // self-service; for first-change the user wouldn't know the old one).
  if (!isForced && input.currentPassword === input.newPassword) {
    return fail(400, 'VALIDATION_ERROR', 'New password must be different from current password');
  }

  const passwordHash = await hashPassword(input.newPassword);
  await db
    .update(users)
    .set({
      passwordHash,
      mustChangePassword: null,
      passwordChangedAt: new Date(),
    })
    .where(eq(users.id, dbUser.id));

  void audit({
    action: 'admin.manager_account.generate', // reuse category
    actor: { role: dbUser.role as 'admin' | 'manager' | 'user', email, username: null },
    ip,
    result: 'success',
    detail: isForced ? 'first-time password change' : 'self-service password change',
  });

  return ok({ message: 'Password updated' });
}