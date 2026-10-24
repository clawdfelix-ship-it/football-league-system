import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getPlatformAdmin } from '@/lib/authz';
import {
  provisionApprovedApplication,
  getApplication,
  ApplicationError,
} from '@/lib/tenant/provisioning.server';
import {
  notifyApplicantProvisioned,
  notifyLeagueOwnerWelcome,
} from '@/lib/tenant/notify.server';
import { recordPlatformEvent } from '@/lib/tenant/audit.server';

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

    // Audit — fire-and-forget (recordPlatformEvent swallows failures).
    void recordPlatformEvent({
      actorEmail: admin.email,
      actorUserId: admin.userId,
      action: 'application.provision',
      targetType: 'application',
      targetId: applicationId,
      targetLabel: result.league.slug,
      metadata: {
        leagueId: result.league.id,
        leagueSlug: result.league.slug,
        leagueName: result.league.name,
        created: result.created,
        ownerEmail: result.owner.email,
        ownerCreated: result.owner.created,
      },
      ip: _request.headers.get('x-forwarded-for') ?? _request.headers.get('x-real-ip'),
      userAgent: _request.headers.get('user-agent'),
    });

    // Best-effort onboarding email. A freshly minted owner account gets the
    // login credentials email (temp password shown once); an idempotent
    // re-run (account already existed) gets the plain 'your league is live'
    // email instead so we never re-send an old password.
    try {
      const app = await getApplication(applicationId);
      if (app) {
        if (result.owner.created && result.owner.tempPassword) {
          await notifyLeagueOwnerWelcome({
            contactName: app.contactName,
            contactEmail: app.contactEmail,
            leagueName: result.league.name,
            ownerEmail: result.owner.email,
            tempPassword: result.owner.tempPassword,
            slug: result.league.slug,
          });
        } else {
          await notifyApplicantProvisioned(
            {
              contactName: app.contactName,
              contactEmail: app.contactEmail,
              leagueName: result.league.name,
            },
            result.league.slug
          );
        }
      }
    } catch (mailErr) {
      console.error('[console] provisioned notice failed:', mailErr);
    }

    // Never echo the one-time password back through the API response.
    const { owner, ...rest } = result;
    return ok(
      { ...rest, owner: { email: owner.email, username: owner.username, created: owner.created } },
      { status: result.created ? 201 : 200 }
    );
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
