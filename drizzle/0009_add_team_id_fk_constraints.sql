-- ============================================================
-- Migration 0009: Add FK constraints on the team_id columns
--
-- Follow-up to 0007 (which added nullable team_id columns + backfilled
-- them but deliberately deferred the foreign keys until data was clean).
--
-- EXECUTED on production (Neon) 2026-09-02.
-- Pre-checks: 0 invalid references across players.team_id,
--   matches.home_team_id, matches.away_team_id.
--
-- ON DELETE SET NULL (not CASCADE): if a team row is ever deleted, the
--   players/matches keep their rows and the team id is nulled out — no
--   historical data is destroyed.
-- ============================================================

BEGIN;

ALTER TABLE players  ADD CONSTRAINT players_team_id_fk
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE matches  ADD CONSTRAINT matches_home_team_id_fk
  FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE matches  ADD CONSTRAINT matches_away_team_id_fk
  FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE SET NULL;

COMMIT;
