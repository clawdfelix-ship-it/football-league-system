/**
 * Audit log for sensitive mutations.
 *
 * Non-blocking, non-breaking addition: callers wrap an existing mutation, and
 * if the log write fails we log to stderr but never throw — the user-facing
 * mutation must still succeed.
 *
 * Storage: writes to console in dev, and to a `audit_log` table in prod once
 * the table exists. The helper detects table existence lazily on first write.
 *
 * This is intentionally minimal — it doesn't block any existing functionality.
 */

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export type AuditAction =
  | 'match.create'
  | 'match.update'
  | 'match.delete'
  | 'match.reset_season'
  | 'match.goals.update'
  | 'player.create'
  | 'player.update'
  | 'player.delete'
  | 'player.photo.upload'
  | 'team.settings.update'
  | 'announcement.create'
  | 'announcement.delete'
  | 'admin.manager_account.generate'
  | 'admin.db_init';

export type AuditActor = {
  role: 'admin' | 'manager' | 'user' | 'anonymous' | 'system';
  email?: string | null;
  username?: string | null;
  teamId?: number | null;
};

export type AuditEntry = {
  action: AuditAction;
  actor: AuditActor;
  target?: { kind: string; id?: string | number | null } | null;
  ip?: string | null;
  result: 'success' | 'denied' | 'error';
  detail?: string | null;
};

let tableReadyPromise: Promise<boolean> | null = null;

/**
 * Best-effort: ensures audit_log table exists. Returns true if usable.
 */
async function ensureTable(): Promise<boolean> {
  if (tableReadyPromise) return tableReadyPromise;
  tableReadyPromise = (async () => {
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS audit_log (
          id BIGSERIAL PRIMARY KEY,
          at TIMESTAMPTZ NOT NULL DEFAULT now(),
          action TEXT NOT NULL,
          actor_role TEXT NOT NULL,
          actor_email TEXT,
          actor_username TEXT,
          actor_team_id INTEGER,
          target_kind TEXT,
          target_id TEXT,
          ip TEXT,
          result TEXT NOT NULL,
          detail TEXT
        );
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_audit_log_at ON audit_log(at DESC);
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
      `);
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_audit_log_actor_email ON audit_log(actor_email);
      `);
      return true;
    } catch (e) {
      console.warn('[audit-log] table setup failed; falling back to stderr only', e);
      return false;
    }
  })();
  return tableReadyPromise;
}

/**
 * Write an audit entry. Never throws.
 */
export async function audit(entry: AuditEntry): Promise<void> {
  // Always log to stderr so dev / log aggregators see it.
  const line = `[audit] ${new Date().toISOString()} ${entry.action} actor=${entry.actor.role}:${entry.actor.email ?? entry.actor.username ?? '?'} target=${entry.target?.kind ?? ''}${entry.target?.id != null ? `:${entry.target.id}` : ''} ip=${entry.ip ?? '?'} result=${entry.result}${entry.detail ? ` detail=${entry.detail}` : ''}`;
  if (entry.result === 'error' || entry.result === 'denied') {
    console.warn(line);
  } else {
    console.log(line);
  }

  try {
    const ok = await ensureTable();
    if (!ok) return;
    await db.execute(sql`
      INSERT INTO audit_log (
        action, actor_role, actor_email, actor_username, actor_team_id,
        target_kind, target_id, ip, result, detail
      ) VALUES (
        ${entry.action},
        ${entry.actor.role},
        ${entry.actor.email ?? null},
        ${entry.actor.username ?? null},
        ${entry.actor.teamId ?? null},
        ${entry.target?.kind ?? null},
        ${entry.target?.id != null ? String(entry.target.id) : null},
        ${entry.ip ?? null},
        ${entry.result},
        ${entry.detail ?? null}
      );
    `);
  } catch (e) {
    console.warn('[audit-log] insert failed; stderr line above is the source of truth', e);
  }
}

/**
 * Convenience: wrap a mutation so it is automatically audited.
 *
 * Usage:
 *   const result = await withAudit(
 *     { action: 'player.delete', actor, target: { kind: 'player', id }, ip },
 *     async () => deletePlayerById(id)
 *   );
 */
export async function withAudit<T>(
  ctx: Omit<AuditEntry, 'result' | 'detail'>,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const result = await fn();
    void audit({ ...ctx, result: 'success' });
    return result;
  } catch (e) {
    void audit({
      ...ctx,
      result: 'error',
      detail: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}