import { TEAMS } from '@/lib/constants';
import { ok, fail } from '@/lib/api/response';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { getAuthContext } from '@/lib/authz';
import { deleteAllMatches } from '@/lib/queries';
import { audit } from '@/lib/auth/audit-log';

export const revalidate = 3600;

export async function GET() {
  try {
    return ok({
      teams: TEAMS.filter((t) => t.name !== 'DEMO').map((t) => t.name),
    });
  } catch {
    return fail(500, 'INTERNAL_ERROR', 'Failed to list teams');
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit(`reset-season:${ip}`, { limit: 3, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    void audit({
      action: 'match.reset_season',
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
        action: 'match.reset_season',
        actor: { role: 'anonymous' },
        ip,
        result: 'denied',
        detail: 'no session',
      });
      return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
    }
    if (auth.role !== 'admin') {
      void audit({
        action: 'match.reset_season',
        actor: { role: auth.role, email: auth.email, username: auth.username, teamId: auth.teamId },
        ip,
        result: 'denied',
        detail: 'not admin',
      });
      return fail(403, 'FORBIDDEN', 'Admin access required');
    }

    await deleteAllMatches();

    void audit({
      action: 'match.reset_season',
      actor: { role: auth.role, email: auth.email, username: auth.username, teamId: auth.teamId },
      ip,
      result: 'success',
      detail: 'all matches deleted',
    });

    return ok({ message: '數據已清除' });
  } catch (e) {
    void audit({
      action: 'match.reset_season',
      actor: { role: 'admin', email: null, username: null },
      ip,
      result: 'error',
      detail: e instanceof Error ? e.message : 'unknown',
    });
    return fail(500, 'INTERNAL_ERROR', 'Failed to reset matches');
  }
}
