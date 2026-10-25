-- ============================================================
-- Migration 0016: Teams contact metadata
--
-- Migrates hardcoded TEAM_CONTACTS data into the DB so league admins can
-- add/edit/delete teams without a code change + redeploy.
--
-- New columns:
--   venue      VARCHAR(200)  -- home ground
--   coach      JSONB         -- { name, email?, phone? }
--   manager    JSONB         -- { name, email?, phone? }
--   captains   JSONB         -- [{ name, email?, phone? }]
--   color      VARCHAR(50)   -- tailwind gradient classes, e.g. 'from-red-600 to-red-800'
--   sort_order INTEGER       -- display order (default = id)
--
-- Idempotent / re-runnable.
-- Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0016_teams_contact_metadata.sql
-- ============================================================

BEGIN;

ALTER TABLE teams ADD COLUMN IF NOT EXISTS venue VARCHAR(200);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS coach JSONB;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS manager JSONB;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS captains JSONB;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Default sort_order to id so existing rows keep insertion order
UPDATE teams SET sort_order = id WHERE sort_order IS NULL;

COMMENT ON COLUMN teams.venue IS 'Home ground name';
COMMENT ON COLUMN teams.coach IS 'Coach contact: { name, email?, phone? }';
COMMENT ON COLUMN teams.manager IS 'Manager contact: { name, email?, phone? }';
COMMENT ON COLUMN teams.captains IS 'Captains array: [{ name, email?, phone? }]';
COMMENT ON COLUMN teams.color IS 'Tailwind gradient classes for team badge';
COMMENT ON COLUMN teams.sort_order IS 'Display order in listings (lower = first)';

COMMIT;
