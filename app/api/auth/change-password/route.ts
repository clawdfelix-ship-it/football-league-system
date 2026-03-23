import { NextResponse } from 'next/server';
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
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const role = (session.user as any)?.role;
  if (role !== 'manager') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const email = String(session.user.email).toLowerCase();

  let currentPassword = '';
  let newPassword = '';
  try {
    const body = await request.json();
    currentPassword = String(body?.currentPassword || '');
    newPassword = String(body?.newPassword || '');
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: 'Missing password fields' }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ message: 'New password must be at least 8 characters' }, { status: 400 });
  }

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
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const ok = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    const okShared = Boolean(managerPassword && currentPassword === managerPassword);
    if (!ok && !okShared) {
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash }).where(eq(users.id, dbUser.id));
    return NextResponse.json({ message: 'Password updated' });
  }

  if (!managerPassword || currentPassword !== managerPassword) {
    return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db.insert(users).values({
    email,
    username: makeUsername(email),
    passwordHash,
    role: 'manager',
  });

  return NextResponse.json({ message: 'Password set' });
}

