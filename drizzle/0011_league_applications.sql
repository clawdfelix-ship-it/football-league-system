-- ============================================================
-- Migration 0011: League provisioning applications (Phase 3)
--
-- Self-serve sign-up queue. A prospective organiser submits an application on
-- the PLATFORM host. A platform admin reviews it; on approval provisioning
-- (lib/tenant/provisioning.server.ts) creates the `leagues` row + creator
-- owner account and links this row via league_id.
--
-- Idempotent / re-runnable. Does not touch existing league #1 data.
-- Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0011_league_applications.sql
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS league_applications (
  id                SERIAL PRIMARY KEY,
  -- Org/league details captured at sign-up.
  league_name       VARCHAR(200) NOT NULL,
  contact_name      VARCHAR(150) NOT NULL,
  contact_email     VARCHAR(200) NOT NULL,
  contact_phone     VARCHAR(50),
  sport_type        VARCHAR(30)  NOT NULL DEFAULT 'football',
  team_count_est    INTEGER,
  notes             TEXT,
  requested_slug    VARCHAR(80),
  -- pending | in_review | approved | rejected | withdrawn
  status            VARCHAR(20)  NOT NULL DEFAULT 'pending',
  review_notes      TEXT,
  reviewed_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  -- Set once provisioned; unique so one application can never create >1 league.
  league_id         INTEGER UNIQUE REFERENCES leagues(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  ALTER TABLE league_applications
    ADD CONSTRAINT league_applications_status_check
    CHECK (status IN ('pending','in_review','approved','rejected','withdrawn')) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- One active (non-terminal) application per contact email is enough; a unique
-- partial index lets the same person re-apply later after reject/withdraw.
CREATE UNIQUE INDEX IF NOT EXISTS league_applications_active_email_key
  ON league_applications (contact_email)
  WHERE status IN ('pending','in_review','approved');

CREATE INDEX IF NOT EXISTS idx_league_applications_status
  ON league_applications (status, created_at);

DROP TRIGGER IF EXISTS league_applications_touch_updated_at ON league_applications;
CREATE TRIGGER league_applications_touch_updated_at BEFORE UPDATE ON league_applications
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

COMMIT;
