-- ============================================================
-- Migration 0018: teams.status column (active / archived)
--
-- Teams with historical match records cannot be deleted without losing
-- league history. Instead they get archived — hidden from new matches
-- and public listings, but data preserved.
--
-- Idempotent / re-runnable.
-- Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0018_teams_status.sql
-- ============================================================

BEGIN;

ALTER TABLE teams ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_teams_league_status ON teams(league_id, status);

COMMENT ON COLUMN teams.status IS 'active | archived. Archived teams are hidden from new matches and public listings but keep their match/player history.';

COMMIT;
