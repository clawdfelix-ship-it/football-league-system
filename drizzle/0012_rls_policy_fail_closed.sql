-- ============================================================
-- 0012_rls_policy_fail_closed.sql
-- Phase 3 hardening (code/security review 2026-10-11).
--
-- Idempotent / re-runnable. Safe on the live single-tenant DB:
-- policies are ENABLEd but NOT FORCEd and the app connects as the
-- table owner (neondb_owner) which BYPASSES RLS, so redefining the
-- policy changes no live behaviour today.
--
-- Why this migration
-- ------------------
-- 0010 created:
--   USING (league_id = NULLIF(current_setting('app.league_id', true),'')::int)
-- When the GUC is unset, NULLIF(...) IS NULL, and "anything = NULL"
-- evaluates to NULL (not true). That happens to be fail-closed, but only
-- by accident; make it explicit so a future FORCE can never silently flip
-- to "no isolation". Also correct the 0010 comment, which claimed the edge
-- middleware could `SET LOCAL app.league_id` per request — that is
-- impossible with the stateless drizzle-orm/neon-http driver (each
-- statement is a separate virtual connection, no session to SET on).
--
-- Policy semantics (intended, once activated with a session driver):
--   app.league_id unset / empty  -> DENY everything (fail-closed, not "see all")
--   app.league_id = <id>         -> only rows of that league
--
-- Activation path (NOT done here; blocked on driver):
--   1. provisioning/tenant queries move to @neondatabase/serverless Pool
--      (WebSocket, session-backed) running as a NOBYPASSRLS role;
--   2. each transaction issues SET LOCAL app.league_id = <id>;
--   3. ALTER TABLE ... FORCE ROW LEVEL SECURITY.
-- Until then the app-layer WHERE league_id is the only enforced boundary.
-- ============================================================

BEGIN;

-- Tenant tables: explicit fail-closed guard.
DROP POLICY IF EXISTS tenant_isolation ON teams;
DROP POLICY IF EXISTS tenant_isolation ON players;
DROP POLICY IF EXISTS tenant_isolation ON matches;
DROP POLICY IF EXISTS tenant_isolation ON announcements;
DROP POLICY IF EXISTS tenant_isolation ON match_player_goals;
DROP POLICY IF EXISTS tenant_isolation ON match_kit_overrides;
DROP POLICY IF EXISTS tenant_isolation ON password_reset_tokens;
DROP POLICY IF EXISTS tenant_isolation ON leagues;
DROP POLICY IF EXISTS tenant_isolation ON users;

CREATE POLICY tenant_isolation ON teams
  USING (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND league_id = NULLIF(current_setting('app.league_id', true), '')::int
  )
  WITH CHECK (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND league_id = NULLIF(current_setting('app.league_id', true), '')::int
  );

CREATE POLICY tenant_isolation ON players
  USING (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND league_id = NULLIF(current_setting('app.league_id', true), '')::int
  )
  WITH CHECK (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND league_id = NULLIF(current_setting('app.league_id', true), '')::int
  );

CREATE POLICY tenant_isolation ON matches
  USING (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND league_id = NULLIF(current_setting('app.league_id', true), '')::int
  )
  WITH CHECK (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND league_id = NULLIF(current_setting('app.league_id', true), '')::int
  );

CREATE POLICY tenant_isolation ON announcements
  USING (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND league_id = NULLIF(current_setting('app.league_id', true), '')::int
  )
  WITH CHECK (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND league_id = NULLIF(current_setting('app.league_id', true), '')::int
  );

CREATE POLICY tenant_isolation ON match_player_goals
  USING (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND league_id = NULLIF(current_setting('app.league_id', true), '')::int
  )
  WITH CHECK (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND league_id = NULLIF(current_setting('app.league_id', true), '')::int
  );

CREATE POLICY tenant_isolation ON match_kit_overrides
  USING (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND league_id = NULLIF(current_setting('app.league_id', true), '')::int
  )
  WITH CHECK (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND league_id = NULLIF(current_setting('app.league_id', true), '')::int
  );

CREATE POLICY tenant_isolation ON password_reset_tokens
  USING (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND league_id = NULLIF(current_setting('app.league_id', true), '')::int
  )
  WITH CHECK (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND league_id = NULLIF(current_setting('app.league_id', true), '')::int
  );

-- The leagues directory itself: a tenant may see only its own league row.
CREATE POLICY tenant_isolation ON leagues
  USING (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND id = NULLIF(current_setting('app.league_id', true), '')::int
  )
  WITH CHECK (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND id = NULLIF(current_setting('app.league_id', true), '')::int
  );

-- users: platform admins carry NULL league_id and must remain visible to a
-- platform session. A platform session is represented by the sentinel GUC
-- value '0'; tenant sessions use their positive league id. Unset = deny.
CREATE POLICY tenant_isolation ON users
  USING (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND (
      NULLIF(current_setting('app.league_id', true), '')::int = 0
      OR league_id IS NULL
      OR league_id = NULLIF(current_setting('app.league_id', true), '')::int
    )
  )
  WITH CHECK (
    NULLIF(current_setting('app.league_id', true), '')::int IS NOT NULL
    AND (
      NULLIF(current_setting('app.league_id', true), '')::int = 0
      OR league_id IS NULL
      OR league_id = NULLIF(current_setting('app.league_id', true), '')::int
    )
  );

COMMIT;
