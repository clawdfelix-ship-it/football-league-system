import { ok, fail } from '@/lib/api/response';
import { ChangePasswordSchema } from '@/lib/api/schemas';
import { zodDetails } from '@/lib/api/zod';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

function makeUsername(email: string) {
  const local = email.split('@')[0] || email;
  const cleaned = local.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const base = `manager-${cleaned}`;
  return base.length <= 50 ? base : base.slice(0, 50);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
  }

  const role = session.user?.role;
  if (role !== 'manager') {
    return fail(403, 'FORBIDDEN', 'Forbidden');
  }

  const email = String(session.user.email).toLowerCase();

  const ip = getClientIp(request);
  const rl = rateLimit(`change-password:${ip}:${email}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) return fail(429, 'RATE_LIMITED', 'Too many requests');

  let input: { currentPassword: string; newPassword: string };
  try {
    input = ChangePasswordSchema.parse(await request.json());
  } catch (e) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid request body', zodDetails(e));
  }

  const currentPassword = input.currentPassword;
  const newPassword = input.newPassword;

  const managerPassword = process.env.MANAGER_PASSWORD;

  const [dbUser] = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email));

  if (dbUser) {
    if (dbUser.role !== 'manager') {
      return fail(403, 'FORBIDDEN', 'Forbidden');
    }

    const passwordOk = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!passwordOk) {
      return fail(400, 'INVALID_CREDENTIALS', 'Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, dbUser.id));
    return ok({ message: 'Password updated' });
  }

  if (!managerPassword || currentPassword !== managerPassword) {
    return fail(400, 'INVALID_CREDENTIALS', 'Current password is incorrect');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db.insert(users).values({
    email,
    username: makeUsername(email),
    passwordHash,
    role: 'manager',
  });

  return ok({ message: 'Password set' });
}
