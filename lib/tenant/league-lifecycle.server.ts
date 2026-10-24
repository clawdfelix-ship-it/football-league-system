/**
 * League lifecycle — server-side DB operations.
 *
 * Wraps the pure state machine in ./league-lifecycle with DB read/update and
 * audit-log emission. Used by the platform console league status routes.
 * See docs/platform-console-p0-spec.md §3.4.
 */

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { leagues, platformAuditEvents } from '@/lib/schema';
import {
  assertLeagueTransition,
  LeagueError,
  type LeagueLifecycleStatus,
} from './league-lifecycle';

export type LifecycleActor = {
  email: string;
  userId?: number | null;
};

export type LifecycleRequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

export type SetLeagueStatusResult = {
  leagueId: number;
  slug: string;
  status: LeagueLifecycleStatus;
};

function actionFor(next: LeagueLifecycleStatus): string {
  if (next === 'active') return 'league.reactivate';
  if (next === 'suspended') return 'league.suspend';
  if (next === 'closed') return 'league.close';
  return `league.${next}`;
}

/**
 * Move a league to a new lifecycle status.
 *
 * Throws LeagueError on NOT_FOUND / INVALID_TRANSITION. Audit failure does not
 * block the status update (matches recordPlatformEvent policy) — but here we
 * inline the insert via a direct db.insert to keep it in one code path; any
 * error there is caught and logged.
 */
export async function setLeagueStatus(
  leagueId: number,
  nextStatus: LeagueLifecycleStatus,
  actor: LifecycleActor,
  requestMeta: LifecycleRequestMeta = {}
): Promise<SetLeagueStatusResult> {
  const [league] = await db
    .select({
      id: leagues.id,
      slug: leagues.slug,
      name: leagues.name,
      status: leagues.status,
    })
    .from(leagues)
    .where(eq(leagues.id, leagueId))
    .limit(1);

  if (!league) {
    throw new LeagueError('NOT_FOUND', `League ${leagueId} not found`);
  }

  const from = league.status as LeagueLifecycleStatus;
  assertLeagueTransition(from, nextStatus);

  await db
    .update(leagues)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(leagues.id, leagueId));

  // Audit — swallowed on failure, matching recordPlatformEvent policy.
  try {
    await db.insert(platformAuditEvents).values({
      actorEmail: actor.email,
      actorUserId: actor.userId ?? null,
      action: actionFor(nextStatus),
      targetType: 'league',
      targetId: league.id,
      targetLabel: league.slug,
      metadata: { from, to: nextStatus, leagueName: league.name },
      ip: requestMeta.ip ?? null,
      userAgent: requestMeta.userAgent ?? null,
    });
  } catch (e) {
    console.error('[audit] failed to record league lifecycle event:', e);
  }

  return { leagueId: league.id, slug: league.slug, status: nextStatus };
}
