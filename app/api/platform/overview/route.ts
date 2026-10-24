import { ok, fail } from '@/lib/api/response';
import { getPlatformAdmin } from '@/lib/authz';
import { getPlatformOverview } from '@/lib/tenant/platform-overview.server';

export const dynamic = 'force-dynamic';

/** Platform console: aggregated per-league stats for the dashboard. */
export async function GET() {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  try {
    const overview = await getPlatformOverview();
    return ok(overview);
  } catch (e) {
    console.error('[platform] overview failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to load overview');
  }
}
