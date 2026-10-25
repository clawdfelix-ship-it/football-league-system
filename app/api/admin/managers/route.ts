import { ok, fail } from '@/lib/api/response';
import { getAuthContext } from '@/lib/authz';
import { getRequestLeagueId } from '@/lib/tenant/context';
import { headers } from 'next/headers';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { db } from '@/lib/db';
import { users, teams } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { audit } from '@/lib/auth/audit-log';
import { hashPassword } from '@/lib/auth/password';
import { generateTempPassword } from '@/lib/auth/temp-password';
import { sendMail } from '@/lib/mail/mailer';
import { accountCreatedEmail } from '@/lib/mail/templates';
import { z } from 'zod';
import { zodDetails } from '@/lib/api/zod';

export const dynamic = 'force-dynamic';

const CreateManagerSchema = z.object({
  email: z.string().trim().email().max(200),
  name: z.string().trim().min(1).max(150),
  teamId: z.number().int().positive(),
});

function makeUsername(teamShortName: string, email: string) {
  const local = email.split('@')[0] || email;
  const base = `${teamShortName}-${local}`.toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return base.length <= 50 ? base : base.slice(0, 50);
}

/** GET: list all managers of the current league (admin only). */
export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
    if (auth.role !== 'admin') return fail(403, 'FORBIDDEN', 'League admin access required');

    const leagueId = await getRequestLeagueId();
    if (auth.leagueId !== leagueId) return fail(403, 'FORBIDDEN', 'Cross-league access denied');

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        teamId: users.teamId,
        createdAt: users.createdAt,
        teamName: teams.name,
        teamShortName: teams.shortName,
      })
      .from(users)
      .leftJoin(teams, eq(users.teamId, teams.id))
      .where(and(eq(users.leagueId, leagueId), eq(users.role, 'manager')))
      .orderBy(users.id);

    return ok({ managers: rows });
  } catch (e) {
    console.error('[managers] GET unexpected error:', e);
    return fail(500, 'INTERNAL_ERROR', 'Unexpected server error');
  }
}

/** POST: create a new manager account (admin only). Returns the temp password ONCE. */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`manager-create:${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) return fail(429, 'RATE_LIMITED', 'Too many requests');

  try {
    const auth = await getAuthContext();
    if (!auth) return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
    if (auth.role !== 'admin') return fail(403, 'FORBIDDEN', 'League admin access required');

    const leagueId = await getRequestLeagueId();
    if (auth.leagueId !== leagueId) return fail(403, 'FORBIDDEN', 'Cross-league access denied');

    let input;
    try {
      input = CreateManagerSchema.parse(await request.json());
    } catch (e) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid request body', zodDetails(e));
    }

    const email = input.email.toLowerCase().trim();

    // Check team belongs to this league
    const [team] = await db
      .select({ id: teams.id, name: teams.name, shortName: teams.shortName })
      .from(teams)
      .where(and(eq(teams.id, input.teamId), eq(teams.leagueId, leagueId)))
      .limit(1);
    if (!team) return fail(404, 'TEAM_NOT_FOUND', '搵唔到呢隊');

    // Email must be globally unique (users.email is unique across all leagues)
    const [existing] = await db
      .select({ id: users.id, leagueId: users.leagueId })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) {
      return fail(409, 'EMAIL_TAKEN', '呢個 email 已經有帳號，請用「重設密碼」');
    }

    const password = generateTempPassword();
    const passwordHash = await hashPassword(password);
    const username = makeUsername(team.shortName || team.name, email);

    const [created] = await db
      .insert(users)
      .values({
        email,
        username,
        passwordHash,
        role: 'manager',
        leagueId,
        teamId: team.id,
        mustChangePassword: new Date(), // force change on first login
      })
      .returning({ id: users.id });

    void audit({
      action: 'admin.manager.create',
      actor: { role: 'admin', email: auth.email ?? null, username: auth.username ?? null },
      ip,
      result: 'success',
      detail: `created manager ${email} for team ${team.name} (id=${team.id})`,
    });

    // Best-effort welcome email; never block the response on SMTP failure.
    try {
      const h = await headers();
      const host = h.get('host');
      const loginUrl = host ? `https://${host}/login` : '/login';
      const tpl = accountCreatedEmail({
        name: input.name,
        email,
        tempPassword: password,
        loginUrl,
      });
      await sendMail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });
    } catch (mailErr) {
      console.warn('[managers] welcome email failed (non-blocking):', mailErr);
    }

    return ok({
      manager: { id: created.id, email, username, teamId: team.id, teamName: team.name },
      tempPassword: password, // shown once in the UI
    });
  } catch (e) {
    console.error('[managers] POST unexpected error:', e);
    return fail(500, 'INTERNAL_ERROR', 'Unexpected server error');
  }
}
