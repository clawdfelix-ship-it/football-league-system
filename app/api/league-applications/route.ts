import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { LeagueApplicationSchema } from '@/lib/api/schemas';
import { zodDetails } from '@/lib/api/zod';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { submitApplication, ApplicationError } from '@/lib/tenant/provisioning.server';
import { notifyAdminsNewApplication } from '@/lib/tenant/notify.server';

export const dynamic = 'force-dynamic';

/**
 * Public self-serve league application (Phase 3b).
 * No auth required, but aggressively rate-limited per IP and guarded by the
 * partial unique index on active applications per email. Input is validated by
 * zod and again inside submitApplication (reserved-slug / email rules).
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  // Tight limit: this is a form a prospective organiser submits once.
  const rl = rateLimit(`league-apply:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    return fail(429, 'RATE_LIMITED', 'Too many requests. Please try again later.');
  }

  let parsed;
  try {
    parsed = LeagueApplicationSchema.parse(await request.json());
  } catch (e) {
    return fail(400, 'VALIDATION_ERROR', 'Invalid application', zodDetails(e));
  }

  try {
    const app = await submitApplication({
      leagueName: parsed.leagueName,
      contactName: parsed.contactName,
      contactEmail: parsed.contactEmail,
      contactPhone: parsed.contactPhone || null,
      sportType: parsed.sportType?.trim() || 'football',
      teamCountEst:
        parsed.teamCountEst === undefined || (parsed.teamCountEst as unknown) === ''
          ? null
          : Number(parsed.teamCountEst),
      notes: parsed.notes || null,
      requestedSlug: parsed.requestedSlug || null,
    });

    // Best-effort admin notification. Never block/fail the applicant's submit
    // if SMTP is unconfigured or the send bounces.
    await notifyAdminsNewApplication(
      {
        id: app.id,
        leagueName: app.leagueName,
        contactName: app.contactName,
        contactEmail: app.contactEmail,
        contactPhone: app.contactPhone,
        sportType: app.sportType,
        teamCountEst: app.teamCountEst,
        notes: app.notes,
        requestedSlug: app.requestedSlug,
      },
      request.headers.get('host')
    );

    return ok(
      {
        id: app.id,
        status: app.status,
      },
      { status: 201 }
    );
  } catch (e) {
    // Friendly, deterministic errors (dup active app, bad slug/email) -> 4xx.
    if (e instanceof ApplicationError) {
      const message = e.message;
      const status = /already exists/i.test(message) ? 409 : 400;
      const code = status === 409 ? 'ACTIVE_APPLICATION_EXISTS' : 'INVALID_APPLICATION';
      return fail(status, code, message);
    }
    console.error('[league-apply] submit failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Could not submit your application');
  }
}
