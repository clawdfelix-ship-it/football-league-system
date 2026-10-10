-- ============================================================
-- Migration 0010: Multi-tenant foundation (Phase 1)
--
-- Turns the single-league schema into a multi-tenant one:
--   * creates `leagues` (tenant root) and seeds the existing league as #1
--   * adds league_id to every tenant-owned table + FKs + indexes
--   * backfills all existing rows to league 1, then enforces NOT NULL
--   * teams become unique per league (drops the global name unique)
--   * migrates the hard-coded TEAMS metadata (short name / zh name /
--     tailwind gradient) from lib/constants.ts into teams columns
--   * enables RLS as a dormant backstop (NOT forced; the connection
--     role is the table owner and bypasses RLS until Phase 2 wires a
--     per-request `app.league_id` GUC in middleware)
--
-- Idempotent / re-runnable. Safe on the current single-tenant data.
-- Apply:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0010_multitenant_foundation.sql
-- ============================================================

BEGIN;

-- ---------- 1. leagues (tenant root) ----------
CREATE TABLE IF NOT EXISTS leagues (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(80)  NOT NULL UNIQUE,
  name            VARCHAR(200) NOT NULL,
  sport_type      VARCHAR(30)  NOT NULL DEFAULT 'football',
  status          VARCHAR(20)  NOT NULL DEFAULT 'active', -- pending|trial|active|suspended|closed
  plan            VARCHAR(30),
  trial_ends_at   TIMESTAMPTZ,
  logo_url        TEXT,
  primary_color   VARCHAR(30),
  banner_url      TEXT,
  announcement    TEXT,
  about_html      TEXT,
  rules_json      JSONB        NOT NULL DEFAULT '{"pointsWin":3,"pointsDraw":1,"pointsLoss":0,"sortBy":"points"}'::jsonb,
  contact_email   VARCHAR(200),
  contact_phone   VARCHAR(50),
  custom_nav      JSONB        NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed the existing league as tenant #1 (idempotent on slug).
INSERT INTO leagues (id, slug, name, sport_type, status, plan)
VALUES (1, 'hkbankleague2026', 'HK Bank League 2026', 'football', 'active', 'founding')
ON CONFLICT (slug) DO NOTHING;
SELECT setval(pg_get_serial_sequence('leagues','id'), GREATEST((SELECT COALESCE(max(id),1) FROM leagues), 1));

-- status guard
DO $$
BEGIN
  ALTER TABLE leagues
    ADD CONSTRAINT leagues_status_check
    CHECK (status IN ('pending','trial','active','suspended','closed')) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- updated_at touch function (created once, reused)
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $fn$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$fn$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leagues_touch_updated_at ON leagues;
CREATE TRIGGER leagues_touch_updated_at BEFORE UPDATE ON leagues
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ---------- 2. teams: league_id + metadata columns ----------
ALTER TABLE teams ADD COLUMN IF NOT EXISTS league_id INTEGER DEFAULT 1 REFERENCES leagues(id) ON DELETE CASCADE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS short_name    VARCHAR(20);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS name_zh       VARCHAR(200);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS color_gradient VARCHAR(100);

UPDATE teams SET league_id = 1 WHERE league_id IS NULL;

-- Migrate the hard-coded lib/constants.ts TEAMS metadata into the DB.
UPDATE teams AS t SET
  short_name     = m.short_name,
  name_zh        = m.name_zh,
  color_gradient = m.color_gradient
FROM (VALUES
  ('NOMURA','NOMURA','野村資產管理',       'from-red-600 to-red-800'),
  ('BBVA',  'BBVA',  '西班牙對外貿易銀行', 'from-blue-600 to-blue-800'),
  ('LGT',   'LGT',   'LGT 銀行',           'from-purple-600 to-purple-800'),
  ('CACIB', 'CACIB', '法國巴黎銀行',       'from-green-600 to-green-800'),
  ('CITI',  'CITI',  '花旗銀行',           'from-blue-400 to-blue-600'),
  ('SCB',   'SCB',   '渣打銀行',           'from-red-400 to-red-600'),
  ('UBS',   'UBS',   '瑞銀集團',           'from-yellow-500 to-orange-600'),
  ('HSBC',  'HSBC',  '匯豐銀行',           'from-red-500 to-red-700'),
  ('KPMG',  'KPMG',  '畢馬威會計師事務所', 'from-indigo-600 to-indigo-800'),
  ('DEMO',  'DEMO',  '示範隊',             'from-slate-600 to-slate-800')
) AS m(name, short_name, name_zh, color_gradient)
WHERE t.name = m.name;

ALTER TABLE teams ALTER COLUMN league_id SET NOT NULL;

-- Team name unique PER LEAGUE, replacing the old global unique.
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_name_key;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teams_league_id_name_key') THEN
    ALTER TABLE teams ADD CONSTRAINT teams_league_id_name_key UNIQUE (league_id, name);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_teams_league_id ON teams(league_id);

-- ---------- 3. players ----------
ALTER TABLE players ADD COLUMN IF NOT EXISTS league_id INTEGER DEFAULT 1 REFERENCES leagues(id) ON DELETE CASCADE;
UPDATE players p SET league_id = t.league_id
  FROM teams t WHERE p.team_id = t.id AND p.league_id IS NULL;
UPDATE players SET league_id = 1 WHERE league_id IS NULL; -- safety net (single historical tenant)
ALTER TABLE players ALTER COLUMN league_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_players_league_id ON players(league_id);

-- ---------- 4. matches ----------
ALTER TABLE matches ADD COLUMN IF NOT EXISTS league_id INTEGER DEFAULT 1 REFERENCES leagues(id) ON DELETE CASCADE;
UPDATE matches m SET league_id = t.league_id
  FROM teams t WHERE m.home_team_id = t.id AND m.league_id IS NULL;
UPDATE matches SET league_id = 1 WHERE league_id IS NULL;
ALTER TABLE matches ALTER COLUMN league_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_league_id ON matches(league_id);

-- ---------- 5. announcements ----------
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS league_id INTEGER DEFAULT 1 REFERENCES leagues(id) ON DELETE CASCADE;
UPDATE announcements SET league_id = 1 WHERE league_id IS NULL;
ALTER TABLE announcements ALTER COLUMN league_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_announcements_league_id ON announcements(league_id);

-- ---------- 6. users (platform admins have NULL league_id) ----------
ALTER TABLE users ADD COLUMN IF NOT EXISTS league_id INTEGER DEFAULT 1 REFERENCES leagues(id) ON DELETE CASCADE;
UPDATE users SET league_id = 1 WHERE league_id IS NULL AND role <> 'admin';
CREATE INDEX IF NOT EXISTS idx_users_league_id ON users(league_id);

-- ---------- 7. child / dependent tables ----------
ALTER TABLE match_player_goals ADD COLUMN IF NOT EXISTS league_id INTEGER DEFAULT 1 REFERENCES leagues(id) ON DELETE CASCADE;
UPDATE match_player_goals g SET league_id = m.league_id
  FROM matches m WHERE g.match_id = m.id AND g.league_id IS NULL;
UPDATE match_player_goals SET league_id = 1 WHERE league_id IS NULL;
ALTER TABLE match_player_goals ALTER COLUMN league_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mpg_league_id ON match_player_goals(league_id);

ALTER TABLE match_kit_overrides ADD COLUMN IF NOT EXISTS league_id INTEGER DEFAULT 1 REFERENCES leagues(id) ON DELETE CASCADE;
UPDATE match_kit_overrides k SET league_id = m.league_id
  FROM matches m WHERE k.match_id = m.id AND k.league_id IS NULL;
UPDATE match_kit_overrides SET league_id = 1 WHERE league_id IS NULL;
ALTER TABLE match_kit_overrides ALTER COLUMN league_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mko_league_id ON match_kit_overrides(league_id);

ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS league_id INTEGER DEFAULT 1 REFERENCES leagues(id) ON DELETE CASCADE;
UPDATE password_reset_tokens r SET league_id = u.league_id
  FROM users u WHERE r.user_id = u.id AND r.league_id IS NULL;
UPDATE password_reset_tokens SET league_id = 1 WHERE league_id IS NULL;
ALTER TABLE password_reset_tokens ALTER COLUMN league_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prt_league_id ON password_reset_tokens(league_id);

-- ============================================================
-- 8. RLS backstop (dormant until Phase 2)
--
-- ENABLE without FORCE: the table-owner role the app currently uses
-- (neondb_owner) BYPASSES RLS, so the live app is unaffected while it
-- still issues unscoped queries. Phase 2 middleware will issue
-- `SET LOCAL app.league_id = <id>` per request, and we will FORCE RLS
-- once every data path scopes correctly.
-- ============================================================
ALTER TABLE teams                ENABLE ROW LEVEL SECURITY;
ALTER TABLE players              ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches              ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_player_goals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_kit_overrides  ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues              ENABLE ROW LEVEL SECURITY;
-- users: platform admins carry NULL league_id; policy allows NULL too.
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON teams;
DROP POLICY IF EXISTS tenant_isolation ON players;
DROP POLICY IF EXISTS tenant_isolation ON matches;
DROP POLICY IF EXISTS tenant_isolation ON announcements;
DROP POLICY IF EXISTS tenant_isolation ON match_player_goals;
DROP POLICY IF EXISTS tenant_isolation ON match_kit_overrides;
DROP POLICY IF EXISTS tenant_isolation ON password_reset_tokens;
DROP POLICY IF EXISTS tenant_isolation ON leagues;

CREATE POLICY tenant_isolation ON teams               USING (league_id = NULLIF(current_setting('app.league_id', true),'')::int) WITH CHECK (league_id = NULLIF(current_setting('app.league_id', true),'')::int);
CREATE POLICY tenant_isolation ON players             USING (league_id = NULLIF(current_setting('app.league_id', true),'')::int) WITH CHECK (league_id = NULLIF(current_setting('app.league_id', true),'')::int);
CREATE POLICY tenant_isolation ON matches             USING (league_id = NULLIF(current_setting('app.league_id', true),'')::int) WITH CHECK (league_id = NULLIF(current_setting('app.league_id', true),'')::int);
CREATE POLICY tenant_isolation ON announcements       USING (league_id = NULLIF(current_setting('app.league_id', true),'')::int) WITH CHECK (league_id = NULLIF(current_setting('app.league_id', true),'')::int);
CREATE POLICY tenant_isolation ON match_player_goals  USING (league_id = NULLIF(current_setting('app.league_id', true),'')::int) WITH CHECK (league_id = NULLIF(current_setting('app.league_id', true),'')::int);
CREATE POLICY tenant_isolation ON match_kit_overrides USING (league_id = NULLIF(current_setting('app.league_id', true),'')::int) WITH CHECK (league_id = NULLIF(current_setting('app.league_id', true),'')::int);
CREATE POLICY tenant_isolation ON password_reset_tokens USING (league_id = NULLIF(current_setting('app.league_id', true),'')::int) WITH CHECK (league_id = NULLIF(current_setting('app.league_id', true),'')::int);
CREATE POLICY tenant_isolation ON leagues
  USING (id = NULLIF(current_setting('app.league_id', true),'')::int)
  WITH CHECK (id = NULLIF(current_setting('app.league_id', true),'')::int);

-- users policy also permits platform-admin rows (league_id IS NULL).
DROP POLICY IF EXISTS tenant_isolation ON users;
CREATE POLICY tenant_isolation ON users
  USING (league_id IS NULL OR league_id = NULLIF(current_setting('app.league_id', true),'')::int)
  WITH CHECK (league_id IS NULL OR league_id = NULLIF(current_setting('app.league_id', true),'')::int);

COMMIT;
