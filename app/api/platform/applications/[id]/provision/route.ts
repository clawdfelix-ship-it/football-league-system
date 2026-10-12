import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getPlatformAdmin } from '@/lib/authz';
import {
  provisionApprovedApplication,
  getApplication,
  ApplicationError,
} from '@/lib/tenant/provisioning.server';
import { notifyApplicantProvisioned } from '@/lib/tenant/notify.server';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * Platform console: provision the league for an approved application.
 * Platform-admin only. Idempotent — provisioning an application that already
 * has a league returns the existing league (created:false).
 */
export async function POST(_request: NextRequest, context: Params) {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  const { id } = await context.params;
  const applicationId = Number(id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid application id');
  }

  try {
    const result = await provisionApprovedApplication(applicationId);

    // Best-effort 'your league is live' email with the tenant URL.
    try {
      const app = await getApplication(applicationId);
      if (app) {
        await notifyApplicantProvisioned(
          {
            contactName: app.contactName,
            contactEmail: app.contactEmail,
            leagueName: result.league.name,
          },
          result.league.slug
        );
      }
    } catch (mailErr) {
      console.error('[console] provisioned notice failed:', mailErr);
    }

    return ok(result, { status: result.created ? 201 : 200 });
  } catch (e) {
    if (e instanceof ApplicationError) {
      const status = /not found/i.test(e.message) ? 404 : 409;
      const code = status === 404 ? 'NOT_FOUND' : 'NOT_PROVISIONABLE';
      return fail(status, code, e.message);
    }
    console.error('[console] provision failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to provision league');
  }
}
