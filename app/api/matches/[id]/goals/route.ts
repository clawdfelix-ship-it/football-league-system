import { ok, fail } from '@/lib/api/response';
import { DeleteByIdParamSchema, MatchGoalsSchema } from '@/lib/api/schemas';
import { zodDetails } from '@/lib/api/zod';
import { getAuthContext } from '@/lib/authz';
import { getMatchById, getPlayersByIds, listMatchGoalEntries, replaceMatchGoalEntries } from '@/lib/queries';

function norm(v: string | null | undefined) {
  return (v ?? '').trim().toUpperCase();
}

export const dynamic = 'force-dynamic';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth) return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
  if (auth.role !== 'admin') return fail(403, 'FORBIDDEN', 'Forbidden');

  const params = await ctx.params;
  let matchId: number;
  try {
    matchId = DeleteByIdParamSchema.parse({ id: params.id }).id;
  } catch (e) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid match id', zodDetails(e));
  }

  try {
    const entries = await listMatchGoalEntries(matchId);
    return ok({ entries });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('match_player_goals') && msg.includes('does not exist')) {
      return fail(409, 'DB_NOT_INITIALIZED', 'Missing match_player_goals table. Run /api/init-db once.');
    }
    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch match goals');
  }
}

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth) return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
  if (auth.role !== 'admin') return fail(403, 'FORBIDDEN', 'Forbidden');

  const params = await ctx.params;
  let matchId: number;
  try {
    matchId = DeleteByIdParamSchema.parse({ id: params.id }).id;
  } catch (e) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid match id', zodDetails(e));
  }

  let body: { entries: Array<{ playerId: number; goals: number }> };
  try {
    body = MatchGoalsSchema.parse(await request.json());
  } catch (e) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid request body', zodDetails(e));
  }

  const match = await getMatchById(matchId);
  if (!match) return fail(404, 'NOT_FOUND', 'Match not found');

  const homeTeam = norm(match.homeTeam);
  const awayTeam = norm(match.awayTeam);

  const inputEntries = (body.entries ?? []).filter((e) => e.goals > 0);
  const playerIds = inputEntries.map((e) => e.playerId);
  const players = await getPlayersByIds(playerIds);
  if (players.length !== Array.from(new Set(playerIds)).length) {
    return fail(400, 'VALIDATION_ERROR', 'One or more players do not exist');
  }

  let sumHome = 0;
  let sumAway = 0;
  for (const e of inputEntries) {
    const p = players.find((x) => x.id === e.playerId);
    const team = norm(p?.team ?? null);
    if (team !== homeTeam && team !== awayTeam) {
      return fail(400, 'VALIDATION_ERROR', 'Player team does not match this match');
    }
    if (team === homeTeam) sumHome += e.goals;
    if (team === awayTeam) sumAway += e.goals;
  }

  if (match.homeScore !== null && sumHome !== match.homeScore) {
    return fail(400, 'VALIDATION_ERROR', `Home goals total (${sumHome}) does not match home score (${match.homeScore})`);
  }
  if (match.awayScore !== null && sumAway !== match.awayScore) {
    return fail(400, 'VALIDATION_ERROR', `Away goals total (${sumAway}) does not match away score (${match.awayScore})`);
  }

  try {
    await replaceMatchGoalEntries(matchId, inputEntries);
    const entries = await listMatchGoalEntries(matchId);
    return ok({ message: 'Match goals saved', entries });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('match_player_goals') && msg.includes('does not exist')) {
      return fail(409, 'DB_NOT_INITIALIZED', 'Missing match_player_goals table. Run /api/init-db once.');
    }
    return fail(500, 'INTERNAL_ERROR', 'Failed to save match goals');
  }
}
