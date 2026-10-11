import { ok, fail } from '@/lib/api/response';
import { getPlatformAdmin } from '@/lib/authz';
import { listProvisionedLeagues } from '@/lib/tenant/provisioning.server';

export const dynamic = 'force-dynamic';

/** Platform console: list every provisioned league (platform-admin only). */
export async function GET() {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  try {
    const leagues = await listProvisionedLeagues();
    return ok({
      leagues: leagues.map((l) => ({
        id: l.id,
        slug: l.slug,
        name: l.name,
        status: l.status,
        plan: l.plan,
        createdAt: l.createdAt,
      })),
    });
  } catch (e) {
    console.error('[console] listProvisionedLeagues failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to list leagues');
  }
}
