-- ============================================================
-- Migration 0015: Impersonate tokens
--
-- Short-lived tokens that let a platform admin enter a league's admin
-- dashboard without knowing the league admin's password. Token is single-
-- use and expires quickly (30 minutes by default).
--
-- Security:
--   - Only the SHA-256 hash is stored; the plaintext token is returned
--     to the platform admin once and embedded in the redirect URL.
--   - Single use: used_at is set on redemption.
--   - Short expiry: 30 minutes.
--   - Every mint + redeem writes a platform_audit_events row.
--
-- Idempotent / re-runnable.
-- Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0015_impersonate_tokens.sql
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS impersonate_tokens (
  id                    SERIAL PRIMARY KEY,
  token_hash            VARCHAR(128) NOT NULL UNIQUE,
  league_id             INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  platform_admin_email  VARCHAR(200) NOT NULL,
  expires_at            TIMESTAMPTZ NOT NULL,
  used_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_impersonate_tokens_league
  ON impersonate_tokens (league_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impersonate_tokens_expires
  ON impersonate_tokens (expires_at);

COMMENT ON TABLE impersonate_tokens IS
  'Short-lived single-use tokens for platform-admin impersonation of a league admin.';

COMMIT;
