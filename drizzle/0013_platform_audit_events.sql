-- ============================================================
-- Migration 0013: Platform admin audit events
--
-- Append-only log of every platform-admin mutation performed via the
-- platform console (lib/tenant/audit.server.ts and
-- lib/tenant/league-lifecycle.server.ts). Actor is identified by email
-- (env allow-list principal), NOT by FK to users.id, because platform
-- admins are env-based and may not have a users row.
--
-- No RLS policy — platform-level table, accessed only by the platform
-- superuser connection. Tenant RLS lives on league-scoped tables.
--
-- Idempotent / re-runnable. Does not touch existing league data.
-- Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0013_platform_audit_events.sql
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS platform_audit_events (
  id            BIGSERIAL PRIMARY KEY,
  actor_email   VARCHAR(200) NOT NULL,
  actor_user_id INTEGER      REFERENCES users(id) ON DELETE SET NULL,
  action        VARCHAR(60)  NOT NULL,
  target_type   VARCHAR(40)  NOT NULL,
  target_id     INTEGER,
  target_label  VARCHAR(200),
  metadata      JSONB        NOT NULL DEFAULT '{}'::jsonb,
  ip            VARCHAR(60),
  user_agent    TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_events_created
  ON platform_audit_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_events_actor
  ON platform_audit_events (actor_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_events_target
  ON platform_audit_events (target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_audit_events_action
  ON platform_audit_events (action, created_at DESC);

COMMENT ON TABLE platform_audit_events IS
  'Append-only platform admin action log. Never UPDATE/DELETE rows.';

COMMIT;
