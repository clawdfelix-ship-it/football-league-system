import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getRequestLeagueId } from '@/lib/tenant/context';
import { db } from '@/lib/db';
import { leagues } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/leagues/current/settings
 * Public (within this league host): returns non-sensitive site settings for
 * the current league so client components can render admin-customised
 * hero title / venues / navbar links / footer links without needing auth.
 * Rate-limited to avoid scrape abuse.
 */
export async function GET(request: NextRequest) {
  const { getClientIp, rateLimit } = await import('@/lib/api/rate-limit');
  const ip = getClientIp(request);
  const rl = rateLimit(`league-current-settings:${ip}`, { limit: 60, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) return fail(429, 'RATE_LIMITED', 'Too many requests');

  try {
    const leagueId = await getRequestLeagueId();
    const [row] = await db
      .select({
        id: leagues.id,
        slug: leagues.slug,
        name: leagues.name,
        siteSettings: leagues.siteSettings,
      })
      .from(leagues)
      .where(eq(leagues.id, leagueId))
      .limit(1);

    if (!row) return fail(404, 'NOT_FOUND', 'League not found');
    return ok(row);
  } catch (e) {
    console.error('[league-current-settings] failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to load league settings');
  }
}
