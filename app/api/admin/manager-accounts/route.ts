import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { TEAM_CONTACTS } from '@/lib/team-contacts';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

function sixDigits() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

function makeUsername(team: string, email: string) {
  const local = email.split('@')[0] || email;
  const base = `${team}-${local}`.toLowerCase();
  return base.length <= 50 ? base : base.slice(0, 50);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any)?.role;
    if (role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    let regenerate = false;
    let mode: 'random' | 'shared' = 'random';
    try {
      const body = await request.json();
      regenerate = Boolean(body?.regenerate);
      mode = body?.mode === 'shared' ? 'shared' : 'random';
    } catch {
      regenerate = false;
    }

    if (mode === 'shared') {
      const sharedPassword = process.env.MANAGER_PASSWORD;
      if (!sharedPassword) {
        return NextResponse.json({ message: 'MANAGER_PASSWORD is not configured on the server' }, { status: 500 });
      }

      const passwordHash = await bcrypt.hash(sharedPassword, 10);
      const updatedEmails: string[] = [];
      const createdEmails: string[] = [];

      for (const teamBlock of TEAM_CONTACTS) {
        for (const captain of teamBlock.captains) {
          if (!captain.email) continue;
          const email = captain.email.toLowerCase().trim();
          const team = teamBlock.team;

          const [existing] = await db
            .select({ email: users.email, username: users.username })
            .from(users)
            .where(eq(users.email, email));

          if (existing) {
            await db
              .update(users)
              .set({
                passwordHash,
                role: 'manager',
                username: existing.username || makeUsername(team, email),
              })
              .where(eq(users.email, email));
            updatedEmails.push(email);
            continue;
          }

          await db.insert(users).values({
            email,
            username: makeUsername(team, email),
            passwordHash,
            role: 'manager',
          });
          createdEmails.push(email);
        }
      }

      return NextResponse.json({
        message: 'Shared manager password applied',
        createdEmails,
        updatedEmails,
      });
    }

    const created: Array<{ team: string; name: string; email: string; password: string }> = [];
    const skipped: Array<{ team: string; name: string; email: string }> = [];

    for (const teamBlock of TEAM_CONTACTS) {
      for (const captain of teamBlock.captains) {
        if (!captain.email) continue;
        const email = captain.email.toLowerCase().trim();
        const team = teamBlock.team;
        const name = captain.name;

      const [existing] = await db
        .select({ email: users.email, username: users.username })
        .from(users)
        .where(eq(users.email, email));

        if (existing) {
          if (!regenerate) {
            skipped.push({ team, name, email });
            continue;
          }
          const password = `${team}${sixDigits()}`;
          const passwordHash = await bcrypt.hash(password, 10);
          await db
            .update(users)
            .set({
              passwordHash,
              role: 'manager',
              username: existing.username || makeUsername(team, email),
            })
            .where(eq(users.email, email));
          created.push({ team, name, email, password });
          continue;
        }

        const password = `${team}${sixDigits()}`;
        const passwordHash = await bcrypt.hash(password, 10);

        await db.insert(users).values({
          email,
          username: makeUsername(team, email),
          passwordHash,
          role: 'manager',
        });

        created.push({ team, name, email, password });
      }
    }

    return NextResponse.json({
      message: 'Manager accounts processed',
      created,
      skipped,
    });
  } catch (e) {
    console.error('Failed to process manager accounts:', e);
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to process manager accounts' },
      { status: 500 }
    );
  }
}
