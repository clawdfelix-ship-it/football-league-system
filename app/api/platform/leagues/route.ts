import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getPlatformAdmin } from '@/lib/authz';
import { listProvisionedLeagues } from '@/lib/tenant/provisioning.server';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

/** Platform console: list every provisioned league (platform-admin only). */
export async function GET(request: NextRequest) {
  // 2026-10-26 audit: platform read — rate limit per IP (30 req / 10 min)
  const ip = getClientIp(request);
  const rl = rateLimit(`platform-leagues:${ip}`, { limit: 30, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) return fail(429, 'RATE_LIMITED', 'Too many requests');

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
