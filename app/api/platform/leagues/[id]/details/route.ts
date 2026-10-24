import { ok, fail } from '@/lib/api/response';
import { getPlatformAdmin } from '@/lib/authz';
import { getLeagueDetails } from '@/lib/tenant/league-details.server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** Platform console: detailed view of one league (platform-admin only). */
export async function GET(_request: Request, context: Params) {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  const { id } = await context.params;
  const leagueId = Number(id);
  if (!Number.isInteger(leagueId) || leagueId <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid league id');
  }

  try {
    const details = await getLeagueDetails(leagueId);
    if (!details) return fail(404, 'NOT_FOUND', 'League not found');
    return ok(details);
  } catch (e) {
    console.error('[platform] league details failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to load league details');
  }
}
