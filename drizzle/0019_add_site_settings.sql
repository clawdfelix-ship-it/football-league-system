-- 0019_add_site_settings.sql
-- 2026-10-26: add site_settings JSONB column to leagues for admin-controlled
-- front-page settings (hero title, venues, navbar links, footer links).
-- Default empty object — existing leagues get no visual change until admin edits.

ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS site_settings jsonb NOT NULL DEFAULT '{}';

-- Index for fast lookup when filtering by site_settings keys (optional, low usage)
CREATE INDEX IF NOT EXISTS idx_leagues_site_settings ON leagues USING gin (site_settings);
