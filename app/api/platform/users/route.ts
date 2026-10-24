import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getPlatformAdmin } from '@/lib/authz';
import { searchPlatformUsers } from '@/lib/tenant/platform-users.server';

export const dynamic = 'force-dynamic';

/** Platform console: search users across all leagues (platform-admin only). */
export async function GET(request: NextRequest) {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  const q = request.nextUrl.searchParams.get('q') ?? '';
  if (!q.trim()) {
    return ok({ users: [] });
  }

  try {
    const rows = await searchPlatformUsers(q);
    return ok({ users: rows });
  } catch (e) {
    console.error('[platform] search users failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to search users');
  }
}
