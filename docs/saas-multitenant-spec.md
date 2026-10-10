# Zenex League — Multi-tenant SaaS Specification

> Status: ACTIVE build — branch `feat/multitenant-saas`
> Started: 2026-10-11
> Safety: production DB backed up to `~/db-backups/football-20261011-011908.sql.gz` before any schema change.

## Goal
Turn the single-league Football League System into a Shopify-like SaaS: leagues self-apply for an account; platform admin approves and provisions an isolated league space on a subdomain, each with its own admin console (managing back-office + front-end content), billed monthly later.

## Locked product decisions
- **Access model:** per-league subdomain `{slug}.zenex-sports.com`; platform console on a separate admin host.
- **Provisioning:** hybrid — self-serve application form → platform admin approves → auto-provision. Data model built for future self-serve + Stripe.
- **Isolation:** single shared Neon Postgres DB, every tenant-owned row carries `league_id`; application layer always scopes queries; Postgres Row-Level Security as backstop.
- **Front-end customisation (level B):** brand (name/logo/primary colour/banner), announcement, rules/about text, contact, custom pages/nav, photo gallery, sponsors, configurable scoring rules (win/draw/loss points). Layout fixed (no page builder).
- **Sport scope:** football now; neutral naming + `sport_type` column; do not hard-code football in the data model.
- **Existing data:** current league becomes tenant #1 (league slug `hkbankleague2026`), all teams/players/matches/users preserved.

## Roles (three tiers)
1. **PLATFORM_ADMIN** — Felix; cross-league console, approve/suspend tenants, plans.
2. **LEAGUE_ADMIN** — customer; manages only their own league: matches/teams/players + front-end content + league users.
3. **MANAGER** — team manager; reads/edits only own team (existing MANAGER role).

## Architecture
- One Next.js app + one Neon DB deployed on Vercel project `football-league-system-zenex`.
- Middleware resolves league from request host (`{slug}.zenex-sports.com`); platform host serves marketing/login + platform console.
- Each request binds a resolved `leagueId`; data layer scopes by it.

## Phased delivery
1. **Data foundation** — `leagues` table, `league_id` FK + indexes/backfill/Rls, migrate existing data to league #1.
2. **Subdomain routing** — middleware league resolver, tenant context helper, host-aware auth.
3. **Platform console + provisioning** — application table, approve flow, auto-create league + admin, welcome email.
4. **Tenant theming/content** — league settings, scoring rules, custom pages/nav, gallery, sponsors.
5. **Role/permission refactor** — three-tier RBAC, league-scoped auth.
6. **Billing (later)** — plan/trial/status fields now; Stripe subscription later.

## Tenant ownership matrix (which tables get league_id)
| Table | league_id | Notes |
|---|---|---|
| leagues | (id) | tenant root |
| league_applications | (league_id nullable until approved) | provisioning |
| users | yes | platform admin rows league_id = NULL |
| teams | yes | unique(league_id,name) instead of global unique |
| players | yes (via team also) | direct column for simple scoping |
| matches | yes (home/away teams same league) | |
| announcements | yes | |
| match_kit_overrides | yes (via match) | |
| match_player_goals | yes (via match/player) | |
| password_reset_tokens | yes (via user) | |
| sessions (NextAuth) | — | managed table; tie by user lookup |

## leagues table fields
id, slug (unique), name, sport_type default 'football', status ('pending'|'trial'|'active'|'suspended'|'closed'), plan, trial_ends_at, logo_url, primary_color, banner_url, announcement, about_html, rules_json (scoring points), contact_email, contact_phone, custom_nav jsonb, created_at, updated_at.

## Scoring rules (rules_json)
{ pointsWin:3, pointsDraw:1, pointsLoss:0, sortBy:'points'|'goalDifference'|... } — standings engine reads from league instead of hard-coded constants.

## Hard constraints / gotchas to remove
- `lib/constants.ts` hard-codes TEAMS (id/name/short/colors) and authz + standings import it. Must become DB-driven per league; migrate the 8 current teams' metadata into `teams` columns.
- Team name globally unique → unique per league.
- Admin login is env ADMIN_EMAIL/ADMIN_PASSWORD. Platform admin can remain env-based initially; league admins must be DB users with league_id + role.

## Validation gates
- `npm run typecheck` and `npm run build` must pass.
- Migration is idempotent and re-runnable on a scratch DB clone before production.
- After Phase 1, existing league must behave identically at hkbankleague2026.zenex-sports.com and the vercel.app preview.
- Never run destructive SQL on production without fresh backup.
