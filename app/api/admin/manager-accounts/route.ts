import { ok, fail } from '@/lib/api/response';
import { ManagerAccountsSchema } from '@/lib/api/schemas';
import { zodDetails } from '@/lib/api/zod';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { TEAM_CONTACTS } from '@/lib/team-contacts';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { audit } from '@/lib/auth/audit-log';
import { hashPassword } from '@/lib/auth/password';
import { generateTempPassword } from '@/lib/auth/temp-password';
import { sendMail } from '@/lib/mail/mailer';
import { accountCreatedEmail } from '@/lib/mail/templates';
import { getRequestLeagueId } from '@/lib/tenant/context';
import { getAuthContext } from '@/lib/authz';

function makeUsername(team: string, email: string) {
  const local = email.split('@')[0] || email;
  const base = `${team}-${local}`.toLowerCase();
  return base.length <= 50 ? base : base.slice(0, 50);
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`manager-accounts:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    void audit({
      action: 'admin.manager_account.generate',
      actor: { role: 'anonymous' },
      ip,
      result: 'denied',
      detail: 'rate limited',
    });
    return fail(429, 'RATE_LIMITED', 'Too many requests');
  }

  try {
    const auth = await getAuthContext();

    if (!auth) {
      void audit({
        action: 'admin.manager_account.generate',
        actor: { role: 'anonymous' },
        ip,
        result: 'denied',
        detail: 'no session',
      });
      return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
    }

    if (auth.role !== 'admin') {
      void audit({
        action: 'admin.manager_account.generate',
        actor: { role: auth.role, email: auth.email ?? null, username: auth.username ?? null },
        ip,
        result: 'denied',
        detail: 'not admin',
      });
      return fail(403, 'FORBIDDEN', 'Forbidden');
    }

    // League accounts are created for the host's league only. On the platform
    // console host (lid 0) there is no league to bind managers to.
    const lid = await getRequestLeagueId();
    if (lid <= 0 || auth.leagueId !== lid) {
      return fail(400, 'NO_TENANT', 'No active league on this host');
    }

    const actor = {
      role: 'admin' as const,
      email: auth.email ?? null,
      username: auth.username ?? null,
    };

    let input: { regenerate?: boolean; mode?: 'random' | 'shared' } = {};
    try {
      input = ManagerAccountsSchema.parse(await request.json().catch(() => ({})));
    } catch (e) {
      void audit({
        action: 'admin.manager_account.generate',
        actor,
        ip,
        result: 'denied',
        detail: 'invalid body: ' + (e instanceof Error ? e.message : 'unknown'),
      });
      return fail(400, 'VALIDATION_ERROR', 'Invalid request body', zodDetails(e));
    }

    const regenerate = Boolean(input.regenerate);
    const mode: 'random' | 'shared' = input.mode === 'shared' ? 'shared' : 'random';

    if (mode === 'shared') {
      const sharedPassword = process.env.MANAGER_PASSWORD;
      if (!sharedPassword) {
        return fail(500, 'CONFIG_ERROR', 'MANAGER_PASSWORD is not configured on the server');
      }

      const passwordHash = await hashPassword(sharedPassword);
      const updatedEmails: string[] = [];
      const createdEmails: string[] = [];

      for (const teamBlock of TEAM_CONTACTS) {
        for (const captain of teamBlock.captains) {
          if (!captain.email) continue;
          const email = captain.email.toLowerCase().trim();
          const team = teamBlock.team;

          const [existing] = await db
            .select({ email: users.email, username: users.username, leagueId: users.leagueId })
            .from(users)
            .where(eq(users.email, email));

          if (existing) {
            // Global-unique email belongs to another league: never overwrite
            // that account's password from a different tenant host.
            if ((existing.leagueId ?? 1) !== lid) {
              updatedEmails.push(email);
              continue;
            }
            await db
              .update(users)
              .set({
                passwordHash,
                role: 'manager',
                username: existing.username || makeUsername(team, email),
              })
              .where(and(eq(users.email, email), eq(users.leagueId, lid)));
            updatedEmails.push(email);
            continue;
          }

          await db.insert(users).values({
            email,
            username: makeUsername(team, email),
            passwordHash,
            role: 'manager',
            leagueId: lid,
          });
          createdEmails.push(email);
        }
      }

      void audit({
        action: 'admin.manager_account.generate',
        actor,
        ip,
        result: 'success',
        detail: `mode=shared created=${createdEmails.length} updated=${updatedEmails.length}`,
      });
      return ok({
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
        .select({ email: users.email, username: users.username, leagueId: users.leagueId })
        .from(users)
        .where(eq(users.email, email));

        if (existing) {
          // Global-unique email owned by another league: never reset that
          // account's password or bind it here. Skip even with regenerate.
          if ((existing.leagueId ?? 1) !== lid) {
            skipped.push({ team, name, email });
            continue;
          }
          if (!regenerate) {
            skipped.push({ team, name, email });
            continue;
          }
          const password = generateTempPassword();
          const passwordHash = await hashPassword(password);
          await db
            .update(users)
            .set({
              passwordHash,
              role: 'manager',
              username: existing.username || makeUsername(team, email),
              mustChangePassword: new Date(),
            })
            .where(and(eq(users.email, email), eq(users.leagueId, lid)));
          created.push({ team, name, email, password });
          continue;
        }

        const password = generateTempPassword();
        const passwordHash = await hashPassword(password);

        await db.insert(users).values({
          email,
          username: makeUsername(team, email),
          passwordHash,
          role: 'manager',
          leagueId: lid,
          mustChangePassword: new Date(),
        });

        created.push({ team, name, email, password });
      }
    }

    void audit({
      action: 'admin.manager_account.generate',
      actor,
      ip,
      result: 'success',
      detail: `mode=random created=${created.length} skipped=${skipped.length} regenerate=${regenerate}`,
    });

    // A：為每個新建帳號自動發帳號建立信（best-effort）
    const emailed: string[] = [];
    const emailFailed: string[] = [];
    const base = process.env.APP_BASE_URL || 'https://football-league-system-zenex.vercel.app';
    for (const c of created) {
      try {
        const msg = accountCreatedEmail({
          name: c.name || null,
          email: c.email,
          tempPassword: c.password,
          loginUrl: `${base.replace(/\/$/, '')}/login`,
        });
        await sendMail({ to: c.email, subject: msg.subject, html: msg.html, text: msg.text });
        emailed.push(c.email);
      } catch (e) {
        emailFailed.push(c.email);
        console.error('Account email failed for', c.email, e);
      }
    }

    return ok({
      message: emailFailed.length
        ? `Processed. ${emailed.length} emailed, ${emailFailed.length} failed — send those passwords manually.`
        : 'Manager accounts processed and credentials emailed.',
      created,
      skipped,
      emailed,
      emailFailed,
    });
  } catch (e) {
    void audit({
      action: 'admin.manager_account.generate',
      actor: { role: 'admin', email: null, username: null },
      ip,
      result: 'error',
      detail: e instanceof Error ? e.message : 'unknown',
    });
    return fail(500, 'INTERNAL_ERROR', e instanceof Error ? e.message : 'Failed to process manager accounts');
  }
}
