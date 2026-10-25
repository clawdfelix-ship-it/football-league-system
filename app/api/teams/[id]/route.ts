import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getAuthContext } from '@/lib/authz';
import { getRequestLeagueId } from '@/lib/tenant/context';
import {
  updateTeam,
  deleteTeam,
  deleteTeamCascade,
  getTeamAssociations,
  TeamError,
} from '@/lib/tenant/teams.server';
import { z } from 'zod';
import { zodDetails } from '@/lib/api/zod';

export const dynamic = 'force-dynamic';

const ContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(50).optional(),
});

const UpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  shortName: z.string().max(20).optional(),
  nameZh: z.string().max(200).optional(),
  color: z.string().max(50).optional(),
  venue: z.string().max(200).optional(),
  coach: ContactSchema.nullable().optional(),
  manager: ContactSchema.nullable().optional(),
  captains: z.array(ContactSchema).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

type Params = { params: Promise<{ id: string }> };

/** PATCH: update a team (league admin only). */
export async function PATCH(request: NextRequest, context: Params) {
  const auth = await getAuthContext();
  if (!auth) return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
  if (auth.role !== 'admin') return fail(403, 'FORBIDDEN', 'League admin access required');

  const leagueId = await getRequestLeagueId();
  if (auth.leagueId !== leagueId) {
    return fail(403, 'FORBIDDEN', 'Cannot manage teams for another league');
  }

  const { id } = await context.params;
  const teamId = Number(id);
  if (!Number.isInteger(teamId) || teamId <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid team id');
  }

  let parsed;
  try {
    parsed = UpdateSchema.parse(await request.json());
  } catch (e) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid request body', zodDetails(e));
  }

  try {
    await updateTeam(leagueId, teamId, parsed);
    return ok({ teamId });
  } catch (e) {
    if (e instanceof TeamError) {
      const status = e.code === 'NOT_FOUND' ? 404 : e.code === 'NAME_TAKEN' ? 409 : 400;
      return fail(status, e.code, e.message);
    }
    console.error('[teams] update failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to update team');
  }
}

/** DELETE: delete a team (league admin only).
 * Query param `mode`: 'release' (players → free agents) or 'delete' (cascade delete players).
 * If the team has matches, deletion is refused — use POST /archive instead.
 */
export async function DELETE(request: NextRequest, context: Params) {
  const auth = await getAuthContext();
  if (!auth) return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
  if (auth.role !== 'admin') return fail(403, 'FORBIDDEN', 'League admin access required');

  const leagueId = await getRequestLeagueId();
  if (auth.leagueId !== leagueId) {
    return fail(403, 'FORBIDDEN', 'Cannot manage teams for another league');
  }

  const { id } = await context.params;
  const teamId = Number(id);
  if (!Number.isInteger(teamId) || teamId <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid team id');
  }

  // Check associations first
  const assoc = await getTeamAssociations(leagueId, teamId);
  if (assoc.matchCount > 0) {
    return fail(409, 'HAS_MATCHES', `球隊有 ${assoc.matchCount} 場比賽記錄，唔可以刪除。建議封存。`, {
      playerCount: assoc.playerCount,
      matchCount: assoc.matchCount,
      suggestion: 'archive',
    });
  }

  const mode = request.nextUrl.searchParams.get('mode') === 'delete' ? 'delete' : 'release';

  try {
    await deleteTeamCascade(leagueId, teamId, mode);
    return ok({ teamId, mode, releasedPlayers: mode === 'release' ? assoc.playerCount : 0, deletedPlayers: mode === 'delete' ? assoc.playerCount : 0 });
  } catch (e) {
    if (e instanceof TeamError) {
      return fail(400, e.code, e.message);
    }
    console.error('[teams] delete failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to delete team');
  }
}
