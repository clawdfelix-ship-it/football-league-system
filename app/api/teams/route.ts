import { TEAMS } from '@/lib/constants';
import { ok, fail } from '@/lib/api/response';
import { getAuthContext } from '@/lib/authz';
import { deleteAllMatches } from '@/lib/queries';

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

export async function POST() {
  try {
    const auth = await getAuthContext();
    if (!auth) return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
    if (auth.role !== 'admin') return fail(403, 'FORBIDDEN', 'Admin access required');

    await deleteAllMatches();

    return ok({ message: '數據已清除' });
  } catch {
    return fail(500, 'INTERNAL_ERROR', 'Failed to reset matches');
  }
}
