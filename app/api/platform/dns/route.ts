import { ok, fail } from '@/lib/api/response';
import { getPlatformAdmin } from '@/lib/authz';
import { db } from '@/lib/db';
import { leagues } from '@/lib/schema';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * Platform console: DNS overview for all league subdomains.
 *
 * Cross-references DB leagues with expected hostnames. Wildcard DNS
 * (*.zenex-sports.com -> cname.vercel-dns.com) means every league slug
 * automatically resolves; this view shows which ones are backed by an
 * active league vs orphaned.
 */
export async function GET() {
  const admin = await getPlatformAdmin();
  if (!admin) return fail(403, 'FORBIDDEN', 'Platform admin access required');

  try {
    const rows = await db
      .select({
        id: leagues.id,
        slug: leagues.slug,
        name: leagues.name,
        status: leagues.status,
        createdAt: leagues.createdAt,
      })
      .from(leagues)
      .orderBy(sql`${leagues.createdAt} ASC`);

    const subdomains = rows.map((l) => ({
      leagueId: l.id,
      slug: l.slug,
      name: l.name,
      status: l.status,
      hostname: `${l.slug}.zenex-sports.com`,
      createdAt: l.createdAt,
    }));

    return ok({
      wildcard: {
        domain: '*.zenex-sports.com',
        target: 'cname.vercel-dns.com',
        status: 'active',
      },
      subdomains,
    });
  } catch (e) {
    console.error('[platform] dns overview failed:', e);
    return fail(500, 'INTERNAL_ERROR', 'Failed to load DNS overview');
  }
}
