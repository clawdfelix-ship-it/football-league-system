-- ============================================================
-- Migration 0008: Add must_change_password columns to users
--
-- ⚠️  THIS MIGRATION HAS NOT BEEN EXECUTED.
-- ⚠️  Review carefully and run manually via:
--     psql $DATABASE_URL -f drizzle/0008_add_must_change_password.sql
--
-- SAFETY PROPERTIES (zero data loss):
--   1. Both columns are nullable → no constraint violation on existing rows.
--   2. must_change_password uses TIMESTAMP not BOOLEAN so we can record the
--      exact set time (admin can audit "when was this password issued").
--   3. password_changed_at is purely informational.
--   4. No existing rows are modified.
-- ============================================================

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;

-- Helpful index for "find users that still need to change password".
CREATE INDEX IF NOT EXISTS idx_users_must_change_password
  ON users(must_change_password)
  WHERE must_change_password IS NOT NULL;

COMMIT;

-- ============================================================
-- AFTER RUNNING THIS MIGRATION, EXECUTE THE SEED SCRIPT:
--
--   cd football-league-system
--   npx tsx scripts/seed-team-passwords.ts
--
-- The script will:
--   1. For each of the 10 teams, generate a random 12-char password
--   2. bcrypt-hash it at 12 rounds
--   3. Insert or update the manager row for each team
--   4. Set must_change_password = now() so first login forces a change
--   5. Print the PLAINTEXT passwords ONCE to the admin terminal
--
-- Admin must capture and deliver (WhatsApp / in-person) each password to
-- the corresponding team manager BEFORE the script is run a second time.
-- ============================================================