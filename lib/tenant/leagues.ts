/**
 * Server-side league directory lookups.
 *
 * The set of leagues changes rarely (only when platform admin approves a new
 * tenant), so the lightweight slug/id/status directory is cached for a short
 * TTL instead of queried on every request. Provisioning (Phase 3) will call
 * invalidateLeagueDirectory() right after it inserts a league.
 */
import { unstable_cache, revalidateTag } from 'next/cache';
import { db } from '@/lib/db';
import { leagues } from '@/lib/schema';
import { asc, eq } from 'drizzle-orm';
import type { LeagueRecord } from './map-league';

const DIRECTORY_TAG = 'league-directory';

const fetchDirectory = unstable_cache(
  async (): Promise<LeagueRecord[]> => {
    const rows = await db
      .select({ id: leagues.id, slug: leagues.slug, status: leagues.status })
      .from(leagues)
      .orderBy(asc(leagues.id));
    return rows;
  },
  ['tenant-league-directory'],
  { revalidate: 60, tags: [DIRECTORY_TAG] }
);

export async function listLeagueDirectory(): Promise<LeagueRecord[]> {
  try {
    return await fetchDirectory();
  } catch (e) {
    // DB cold-start/transient failure: do not take the whole site down. The
    // request falls back to host-only/default resolution by the caller.
    console.error('[tenant] listLeagueDirectory failed:', e);
    return [];
  }
}

export async function getLeagueBySlug(slug: string): Promise<LeagueRecord | null> {
  const all = await listLeagueDirectory();
  return all.find((l) => l.slug === slug) ?? null;
}

export async function invalidateLeagueDirectory(): Promise<void> {
  // Next 16 requires a cache profile alongside the tag. Called only by
  // provisioning (Phase 3) after inserting a league.
  revalidateTag(DIRECTORY_TAG, 'default');
}

// Re-export for callers that only need the founding league row.
export async function getDefaultLeague() {
  const [row] = await db.select().from(leagues).where(eq(leagues.id, 1)).limit(1);
  return row ?? null;
}
