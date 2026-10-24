/**
 * Platform admin audit log (server-only).
 *
 * Append-only record of every platform-admin mutation. Used by the platform
 * console routes to leave a trail of who-did-what-when.
 *
 * Failure policy: audit write failures are logged via console.error and
 * swallowed — they must NEVER block the underlying admin action, otherwise a
 * DB hiccup locks the entire console. See docs/platform-console-p0-spec.md §3.3.
 */

import { db } from '@/lib/db';
import { platformAuditEvents } from '@/lib/schema';

export type AuditInput = {
  /** Platform admin email from the session (env allow-list principal). */
  actorEmail: string;
  /** Optional FK to users.id when the actor has a DB row; usually null for env-based platform admins. */
  actorUserId?: number | null;
  /** Dot-namespaced action, e.g. 'league.suspend' / 'application.approve'. */
  action: string;
  targetType: 'league' | 'application' | 'user' | 'platform';
  targetId?: number | null;
  /** Human-readable snapshot (league slug, application ref) so log survives renames. */
  targetLabel?: string | null;
  /** Free-form payload — typically { from, to } diffs or extra context. */
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
};

export async function recordPlatformEvent(input: AuditInput): Promise<void> {
  try {
    await db.insert(platformAuditEvents).values({
      actorEmail: input.actorEmail,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      targetLabel: input.targetLabel ?? null,
      metadata: input.metadata ?? {},
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    });
  } catch (e) {
    console.error('[audit] failed to record event:', input.action, e);
  }
}
