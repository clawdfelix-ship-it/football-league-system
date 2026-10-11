import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { zodDetails } from '@/lib/api/zod';
import { getPlatformAdmin } from '@/lib/authz';
import {
  getApplication,
  setApplicationStatus,
  setApplicationReviewNotes,
  ApplicationError,
} from '@/lib/tenant/provisioning.server';
import { isApplicationStatus } from '@/lib/tenant/provisioning';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  status: z
    .enum(['pending', 'in_review', 'approved', 'rejected', 'withdrawn'])
    .optional(),
  reviewNotes: z.string().trim().max(4000).nullable().optional(),
});

type Params = { params: Promise<{ id: string }> };

/**
 * Platform console: move one application through the review state machine.
 * Platform-admin only. Illegal transitions are rejected by the shared pure
 * guard (assertApplicationTransition) inside setApplicationStatus.
 */
export async function PATCH(request: NextRequest, context: Params) {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  const { id } = await context.params;
  const applicationId = Number(id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid application id');
  }

  let parsed;
  try {
    parsed = PatchSchema.parse(await request.json());
  } catch (e) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid request body', zodDetails(e));
  }

  try {
    const existing = await getApplication(applicationId);
    if (!existing) return fail(404, 'NOT_FOUND', 'Application not found');

    // reviewerId null: platform admins are identified by email allow-list and
    // may not have a users row; reviewed_at/notes still record the action.
    if (parsed.status && isApplicationStatus(parsed.status)) {
      const row = await setApplicationStatus(
        applicationId,
        parsed.status,
        null,
        parsed.reviewNotes ?? null
      );
      return ok({
        id: row.id,
        status: row.status,
        reviewNotes: row.reviewNotes,
        reviewedAt: row.reviewedAt,
      });
    }

    // Notes-only update: keep the same status (a same-status write through the
    // state machine would be an illegal self-transition).
    if (parsed.reviewNotes !== undefined) {
      const row = await setApplicationReviewNotes(applicationId, parsed.reviewNotes);
      return ok({
        id: row.id,
        status: row.status,
        reviewNotes: row.reviewNotes,
        reviewedAt: row.reviewedAt,
      });
    }

    return fail(400, 'VALIDATION_ERROR', 'Nothing to update');
  } catch (e) {
    if (e instanceof ApplicationError) {
      return fail(409, 'ILLEGAL_TRANSITION', e.message);
    }
    console.error('[console] setApplicationStatus failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to update application');
  }
}

/** Read a single application (platform admin only). */
export async function GET(_request: NextRequest, context: Params) {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  const { id } = await context.params;
  const applicationId = Number(id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid application id');
  }

  const row = await getApplication(applicationId);
  if (!row) return fail(404, 'NOT_FOUND', 'Application not found');

  return ok({
    id: row.id,
    leagueName: row.leagueName,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    sportType: row.sportType,
    teamCountEst: row.teamCountEst,
    notes: row.notes,
    requestedSlug: row.requestedSlug,
    status: row.status,
    reviewNotes: row.reviewNotes,
    leagueId: row.leagueId,
    createdAt: row.createdAt,
    reviewedAt: row.reviewedAt,
  });
}
