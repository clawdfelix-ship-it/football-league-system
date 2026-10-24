-- ============================================================
-- Migration 0014: Platform admin allow-list (DB-backed)
--
-- Complements the env-based PLATFORM_ADMIN_EMAILS list. The env list is
-- still honored (bootstrap / break-glass); this table lets platform admins
-- add or remove additional admins at runtime without a redeploy.
--
-- Idempotent / re-runnable.
-- Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0014_platform_admins.sql
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS platform_admins (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(200) NOT NULL,
  added_by    VARCHAR(200),                 -- actor email who added this entry
  note        TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_admins_email
  ON platform_admins (lower(email));

COMMENT ON TABLE platform_admins IS
  'DB-backed platform admin allow-list. Env PLATFORM_ADMIN_EMAILS still honored.';

COMMIT;
