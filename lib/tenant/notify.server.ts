/**
 * Admin notification emails for the platform console (Phase 3b).
 *
 * Pure content builders live here so they are unit-testable; the actual SMTP
 * send lives in notifyAdminsXxx which swallows transport failures — a missing
 * SMTP config or bounced email must never block the applicant's submission.
 */
import { sendMail, isMailConfigured } from '@/lib/mail/mailer';
import { platformAdminEmails } from './platform-admin';
import {
  applicationReceivedEmail,
  applicationUnderReviewEmail,
  applicationApprovedEmail,
  applicationRejectedEmail,
  leagueProvisionedEmail,
  leagueOwnerWelcomeEmail,
} from '@/lib/mail/templates';
import { TRIAL_DAYS } from './config';

export type ApplicationNotice = {
  id: number;
  leagueName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  sportType?: string | null;
  teamCountEst?: number | null;
  notes?: string | null;
  requestedSlug?: string | null;
};

function esc(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const row = (label: string, value: string | number | null | undefined) =>
  `<tr><td style="padding:4px 12px 4px 0;font-weight:600;color:#475569;vertical-align:top">${esc(
    label
  )}</td><td style="padding:4px 0;color:#0f172a">${esc(value == null ? '' : String(value))}</td></tr>`;

/** Platform console URL. Always uses the dedicated platform host because the
 * apex/www point at Shopify, not Vercel (audit 2026-10-12). */
import { PLATFORM_PUBLIC_URL } from './config';

export function consoleUrl(): string {
  return `${PLATFORM_PUBLIC_URL}/platform`;
}

export function applicationNoticeEmail(input: ApplicationNotice) {
  const url = consoleUrl();
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#1d4ed8;color:#fff;padding:18px 24px">
      <div style="font-size:16px;font-weight:700">New League Application</div>
      <div style="font-size:13px;opacity:.85">Zenex Sports platform — review required</div>
    </div>
    <table style="width:100%;border-collapse:collapse;padding:8px 0;font-size:14px">
      ${row('League', input.leagueName)}
      ${row('Contact', `${input.contactName} (${input.contactEmail})`)}
      ${row('Phone', input.contactPhone)}
      ${row('Sport', input.sportType)}
      ${row('Est. teams', input.teamCountEst)}
      ${row('Requested slug', input.requestedSlug)}
      ${row('Notes', input.notes)}
    </table>
    <div style="padding:8px 24px 24px">
      <a href="${url}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:600">Review in console</a>
      <div style="margin-top:12px;font-size:12px;color:#94a3b8">Application #${input.id} · <a href="${url}" style="color:#64748b">${url}</a></div>
    </div>
  </div>`;
  const text = [
    'New League Application',
    `#${input.id} — ${input.leagueName}`,
    `Contact: ${input.contactName} <${input.contactEmail}>` +
      (input.contactPhone ? ` / ${input.contactPhone}` : ''),
    input.sportType ? `Sport: ${input.sportType}` : '',
    input.teamCountEst != null ? `Est. teams: ${input.teamCountEst}` : '',
    input.requestedSlug ? `Requested slug: ${input.requestedSlug}` : '',
    input.notes ? `Notes: ${input.notes}` : '',
    '',
    `Review: ${url}`,
  ]
    .filter(Boolean)
    .join('\n');
  return {
    subject: `[Zenex] New league application: ${input.leagueName}`,
    html,
    text,
  };
}

/**
 * Email every PLATFORM_ADMIN_EMAILS recipient about a new application.
 * Best-effort: returns whether mail was sent; logs and resolves false on any
 * failure so the public application endpoint stays available.
 */
export async function notifyAdminsNewApplication(
  input: ApplicationNotice
): Promise<boolean> {
  const recipients = [...platformAdminEmails()];
  if (recipients.length === 0 || !isMailConfigured()) {
    console.warn('[mail] skipping admin application notice (no admins or SMTP unconfigured)');
    return false;
  }
  try {
    const { subject, html, text } = applicationNoticeEmail(input);
    await sendMail({ to: recipients, replyTo: input.contactEmail, subject, html, text });
    return true;
  } catch (e) {
    console.error('[mail] admin application notice failed:', e);
    return false;
  }
}

/* ── Applicant-facing lifecycle notifications ──────────────────────────── */

export type ApplicantNotice = {
  contactName: string | null;
  contactEmail: string;
  leagueName: string;
};

async function sendApplicant(
  to: string,
  built: { subject: string; html: string; text: string }
): Promise<boolean> {
  if (!isMailConfigured()) {
    console.warn('[mail] skipping applicant notice (mail unconfigured)');
    return false;
  }
  try {
    await sendMail({ to, subject: built.subject, html: built.html, text: built.text });
    return true;
  } catch (e) {
    // Never block the console state transition on a mail failure.
    console.error('[mail] applicant notice failed:', e);
    return false;
  }
}

export async function notifyApplicantReceived(input: ApplicantNotice): Promise<boolean> {
  return sendApplicant(
    input.contactEmail,
    applicationReceivedEmail({ name: input.contactName, leagueName: input.leagueName })
  );
}

export async function notifyApplicantStatus(
  input: ApplicantNotice,
  status: 'in_review' | 'approved' | 'rejected',
  reviewNotes?: string | null
): Promise<boolean> {
  const name = input.contactName;
  if (status === 'in_review') {
    return sendApplicant(
      input.contactEmail,
      applicationUnderReviewEmail({ name, leagueName: input.leagueName })
    );
  }
  if (status === 'approved') {
    return sendApplicant(
      input.contactEmail,
      applicationApprovedEmail({ name, leagueName: input.leagueName })
    );
  }
  return sendApplicant(
    input.contactEmail,
    applicationRejectedEmail({ name, leagueName: input.leagueName, reason: reviewNotes ?? null })
  );
}

export async function notifyApplicantProvisioned(
  input: ApplicantNotice,
  slug: string
): Promise<boolean> {
  const base = process.env.TENANT_BASE_DOMAIN || 'zenex-sports.com';
  const url = `https://${slug}.${base}`;
  return sendApplicant(
    input.contactEmail,
    leagueProvisionedEmail({
      name: input.contactName,
      leagueName: input.leagueName,
      url,
      trialDays: TRIAL_DAYS,
    })
  );
}

/**
 * Owner onboarding email: league is live AND the organiser's admin login
 * (one-time temp password) is ready. `tempPassword` is included ONLY on the
 * freshly-minted account; callers must pass null on idempotent re-runs.
 */
export async function notifyLeagueOwnerWelcome(input: {
  contactName: string | null;
  contactEmail: string;
  leagueName: string;
  ownerEmail: string;
  tempPassword: string;
  slug: string;
}): Promise<boolean> {
  if (!isMailConfigured()) {
    console.warn('[mail] skipping owner welcome (mail unconfigured)');
    return false;
  }
  const base = process.env.TENANT_BASE_DOMAIN || 'zenex-sports.com';
  const loginUrl = `https://${input.slug}.${base}/login`;
  try {
    const built = leagueOwnerWelcomeEmail({
      name: input.contactName,
      leagueName: input.leagueName,
      email: input.ownerEmail,
      tempPassword: input.tempPassword,
      loginUrl,
      trialDays: TRIAL_DAYS,
    });
    await sendMail({ to: input.contactEmail, subject: built.subject, html: built.html, text: built.text });
    return true;
  } catch (e) {
    console.error('[mail] owner welcome failed:', e);
    return false;
  }
}
