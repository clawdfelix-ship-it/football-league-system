import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getAuthContext } from '@/lib/authz';
import { getRequestLeagueId } from '@/lib/tenant/context';
import {
  archiveTeam,
  unarchiveTeam,
  getTeamAssociations,
  TeamError,
} from '@/lib/tenant/teams.server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** POST: archive or unarchive a team (league admin only). */
export async function POST(request: NextRequest, context: Params) {
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

  const body = await request.json().catch(() => ({}));
  const action = body.action === 'unarchive' ? 'unarchive' : 'archive';

  try {
    if (action === 'archive') {
      await archiveTeam(leagueId, teamId);
    } else {
      await unarchiveTeam(leagueId, teamId);
    }
    return ok({ teamId, action });
  } catch (e) {
    if (e instanceof TeamError) {
      return fail(404, e.code, e.message);
    }
    console.error('[teams] archive failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to archive team');
  }
}
