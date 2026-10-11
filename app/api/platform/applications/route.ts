import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getPlatformAdmin } from '@/lib/authz';
import { listApplications } from '@/lib/tenant/provisioning.server';
import type { ApplicationStatus } from '@/lib/tenant/provisioning';

export const dynamic = 'force-dynamic';

const ALLOWED: ReadonlySet<ApplicationStatus> = new Set([
  'pending',
  'in_review',
  'approved',
  'rejected',
  'withdrawn',
]);

/**
 * Platform console: list league applications.
 * Platform-admin only (email allow-list), independent of any league role.
 */
export async function GET(request: NextRequest) {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  const status = request.nextUrl.searchParams.get('status') as ApplicationStatus | null;
  if (status && !ALLOWED.has(status)) {
    return fail(400, 'VALIDATION_ERROR', `Unknown status filter: ${status}`);
  }

  try {
    const rows = await listApplications(status ?? undefined);
    return ok({
      applications: rows.map((r) => ({
        id: r.id,
        leagueName: r.leagueName,
        contactName: r.contactName,
        contactEmail: r.contactEmail,
        contactPhone: r.contactPhone,
        sportType: r.sportType,
        teamCountEst: r.teamCountEst,
        notes: r.notes,
        requestedSlug: r.requestedSlug,
        status: r.status,
        reviewNotes: r.reviewNotes,
        leagueId: r.leagueId,
        createdAt: r.createdAt,
        reviewedAt: r.reviewedAt,
      })),
    });
  } catch (e) {
    console.error('[console] listApplications failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to list applications');
  }
}
