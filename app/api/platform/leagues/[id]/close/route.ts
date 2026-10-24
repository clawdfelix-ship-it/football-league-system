import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getPlatformAdmin } from '@/lib/authz';
import { setLeagueStatus } from '@/lib/tenant/league-lifecycle.server';
import { LeagueError } from '@/lib/tenant/league-lifecycle';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** Platform console: close a league (terminal). Platform-admin only. */
export async function POST(request: NextRequest, context: Params) {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  const { id } = await context.params;
  const leagueId = Number(id);
  if (!Number.isInteger(leagueId) || leagueId <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid league id');
  }

  try {
    const result = await setLeagueStatus(leagueId, 'closed', {
      email: admin.email,
      userId: admin.userId,
    }, {
      ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });
    return ok(result);
  } catch (e) {
    if (e instanceof LeagueError) {
      return fail(400, e.code, e.message);
    }
    console.error('[platform] close failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to close league');
  }
}
