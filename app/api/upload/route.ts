import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { getAuthContext } from '@/lib/authz';
import { audit } from '@/lib/auth/audit-log';

/**
 * DEPRECATED — kept for backward compatibility with old clients.
 *
 * This endpoint historically returned a base64 data: URL. It does NOT persist
 * anything to Vercel Blob and forces the client to inline large blobs into the
 * database row, which is wasteful and unsafe.
 *
 * Use the server action `uploadPlayerPhoto` from `@/lib/actions` instead.
 *
 * This handler still requires auth + rate limit so a regression cannot be
 * weaponized, and returns 410 Gone so old clients surface the migration.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`upload:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) return fail(429, 'RATE_LIMITED', 'Too many requests');

  const auth = await getAuthContext();
  if (!auth) {
    void audit({
      action: 'player.photo.upload',
      actor: { role: 'anonymous' },
      ip,
      result: 'denied',
      detail: 'deprecated /api/upload endpoint',
    });
    return fail(410, 'GONE', 'This endpoint is deprecated. Use the uploadPlayerPhoto server action.');
  }

  void audit({
    action: 'player.photo.upload',
    actor: { role: auth.role, email: auth.email, username: auth.username, teamId: auth.teamId },
    ip,
    result: 'denied',
    detail: 'deprecated /api/upload endpoint',
  });

  return fail(
    410,
    'GONE',
    'This endpoint is deprecated. Use the uploadPlayerPhoto server action from @/lib/actions.'
  );
}

export async function GET() {
  return ok({
    deprecated: true,
    message: 'POST to this endpoint returns 410. Use uploadPlayerPhoto server action.',
  });
}