-- ============================================================
-- Migration 0017: users.team_id column (DB id, not array index)
--
-- Phase B of teams migration: moves from TEAMS array index to DB id.
-- Safe: adds nullable column, does NOT break existing sessions.
-- Existing sessions with array-index teamId continue to work via
-- fallback in lib/auth.ts.
--
-- Idempotent / re-runnable.
-- Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0017_users_team_id.sql
-- ============================================================

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id INTEGER;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id) WHERE team_id IS NOT NULL;

COMMENT ON COLUMN users.team_id IS 'FK to teams.id (DB id, not array index). NULL = not assigned or legacy session.';

COMMIT;
