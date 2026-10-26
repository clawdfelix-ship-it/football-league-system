import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getAuthContext } from '@/lib/authz';
import { getRequestLeagueId } from '@/lib/tenant/context';
import { listTeamsForLeague, createTeam, TeamError } from '@/lib/tenant/teams.server';
import { z } from 'zod';
import { zodDetails } from '@/lib/api/zod';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(50).optional(),
});

const CreateSchema = z.object({
  name: z.string().min(1).max(100),
  shortName: z.string().max(20).optional(),
  nameZh: z.string().max(200).optional(),
  color: z.string().max(50).optional(),
  venue: z.string().max(200).optional(),
  coach: ContactSchema.nullable().optional(),
  manager: ContactSchema.nullable().optional(),
  captains: z.array(ContactSchema).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

/** GET: list teams for the current league (public read; league-scoped). */
export async function GET(request: NextRequest) {
  // 2026-10-26 audit: public read — rate limit per IP (60 req / 10 min)
  const ip = getClientIp(request);
  const rl = rateLimit(`teams-list:${ip}`, { limit: 60, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) return fail(429, 'RATE_LIMITED', 'Too many requests');

  try {
    const leagueId = await getRequestLeagueId();
    const rows = await listTeamsForLeague(leagueId);
    return ok({ teams: rows });
  } catch (e) {
    console.error('[teams] list failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to list teams');
  }
}

/** POST: create a new team (league admin only). */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
  if (auth.role !== 'admin') return fail(403, 'FORBIDDEN', 'League admin access required');

  const leagueId = await getRequestLeagueId();
  if (auth.leagueId !== leagueId) {
    return fail(403, 'FORBIDDEN', 'Cannot manage teams for another league');
  }

  let parsed;
  try {
    parsed = CreateSchema.parse(await request.json());
  } catch (e) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid request body', zodDetails(e));
  }

  try {
    const team = await createTeam(leagueId, parsed);
    return ok({ team }, { status: 201 });
  } catch (e) {
    if (e instanceof TeamError) {
      const status = e.code === 'NAME_TAKEN' ? 409 : 400;
      return fail(status, e.code, e.message);
    }
    console.error('[teams] create failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to create team');
  }
}
