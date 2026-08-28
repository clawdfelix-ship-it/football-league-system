-- ============================================================
-- Migration 0007: Add nullable team_id FKs to players and matches
--
-- ⚠️  THIS MIGRATION HAS NOT BEEN EXECUTED.
-- ⚠️  Review carefully and run manually via:
--     psql $DATABASE_URL -f drizzle/0007_add_team_id_fks_safe.sql
--
-- SAFETY PROPERTIES (zero data loss):
--   1. Every column is added as NULLABLE → no constraint violation on
--      existing rows.
--   2. No foreign key is added in this file → we can backfill first and
--      add FK constraints in a separate migration once data is clean.
--   3. No data is dropped or modified.
--   4. The backfill is idempotent: any non-empty `team` string will be
--      matched to its `teams` row, otherwise left NULL.
-- ============================================================

BEGIN;

-- 1. Add nullable team_id columns (safe on existing tables).
ALTER TABLE players ADD COLUMN IF NOT EXISTS team_id INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_team_id INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_team_id INTEGER;

-- 2. Backfill from the existing string columns. Case-insensitive match on
--    teams.name (the existing column that already has unique rows).
--    Rows that don't match are left NULL — never raises an error.
UPDATE players p
   SET team_id = t.id
  FROM teams t
 WHERE LOWER(TRIM(t.name)) = LOWER(TRIM(p.team))
   AND p.team_id IS NULL;

UPDATE matches m
   SET home_team_id = t.id
  FROM teams t
 WHERE LOWER(TRIM(t.name)) = LOWER(TRIM(m.home_team))
   AND m.home_team_id IS NULL;

UPDATE matches m
   SET away_team_id = t.id
  FROM teams t
 WHERE LOWER(TRIM(t.name)) = LOWER(TRIM(m.away_team))
   AND m.away_team_id IS NULL;

-- 3. Helpful indexes (no constraint changes).
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team_id ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team_id ON matches(away_team_id);

-- 4. Diagnostic snapshot — does NOT modify data.
--    Run this manually to confirm coverage:
--      SELECT
--        (SELECT COUNT(*) FROM players WHERE team_id IS NULL) AS players_unmapped,
--        (SELECT COUNT(*) FROM players) AS players_total,
--        (SELECT COUNT(*) FROM matches WHERE home_team_id IS NULL) AS matches_home_unmapped,
--        (SELECT COUNT(*) FROM matches WHERE away_team_id IS NULL) AS matches_away_unmapped,
--        (SELECT COUNT(*) FROM matches) AS matches_total;

COMMIT;

-- ============================================================
-- FOLLOW-UP MIGRATION (0008, do NOT include in this file):
--
-- Once the diagnostic above shows 0 unmapped rows (or you've decided which
-- legacy rows to delete), run:
--
--   ALTER TABLE players  ADD CONSTRAINT players_team_id_fk
--     FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
--   ALTER TABLE matches  ADD CONSTRAINT matches_home_team_id_fk
--     FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE SET NULL;
--   ALTER TABLE matches  ADD CONSTRAINT matches_away_team_id_fk
--     FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE SET NULL;
--
-- Note: SET NULL (not CASCADE) preserves all existing data even if a team
-- row is deleted — better safety default.
-- ============================================================