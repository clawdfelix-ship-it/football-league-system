# Multi-tenant Go-Live Checklist

Branch `feat/multitenant-saas`. Pure code for Phases 1–5 + trial/email hardening
is complete. This is the operational checklist to actually switch on a **second**
league without regressing the founding league (`hkbankleague2026`).

Architecture recap: single Neon DB, every tenant row carries `league_id`,
`{slug}.zenex-sports.com` subdomains resolve to a league, host-bound auth, and
dormant RLS policies as a backstop. See `saas-multitenant-spec.md`.

---

## 0. Rollout safety order

Do these **in order**. Steps 1–4 are reversible and do not change live behaviour;
the wildcard domain (step 5) is the first point at which real new subdomains
exist.

1. Merge + deploy on the existing `vercel.app` host and confirm the founding
   league is byte-for-byte unchanged **before** adding any custom domain.
2. Add env vars (no code reads new behaviour until domain/DNS exist).
3. Apply any pending SQL migration (currently **none pending** — 0012 is live).
4. Add apex domain only; verify `/platform` console.
5. Add wildcard `*.zenex-sports.com` last.

---

## 1. Merge / deploy founding league with zero regression

- [ ] `npm run typecheck`, `npx vitest run` (all green), `npx eslint .` (0 errors),
      `npm run build` all pass locally.
- [ ] Merge `feat/multitenant-saas` → default branch / deploy.
- [ ] On the existing vercel.app URL (host kind `default` → league #1), smoke test:
  - [ ] `/`, `/fixtures`, `/teams`, `/players`, `/overview` return 200
  - [ ] `/api/matches` returns the expected fixtures (currently 44)
  - [ ] A real **manager can log in** (host resolves to founding league)
  - [ ] Forgot-password / reset-password email still sends
- [ ] Confirm production row counts are unchanged:
      `leagues=1 teams=10 players=224 matches=44 users=20`

> Why: existing managers hit the default host → league 1. Tenant scoping is
> backward-compatible, but prove it on the one live league before new DNS.

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

Required:

- [ ] `DATABASE_URL` — Neon **pooled** string for the app (already set)
- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` — bootstrap super-admin (platform principal)
- [ ] `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- [ ] `BLOB_READ_WRITE_TOKEN` — player photo uploads
- [ ] `MANAGER_MAPPING_JSON` — manager email → team-index map (or the gitignored
      `lib/auth/manager-mapping.server.ts`)
- [ ] SMTP (Zoho): `SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS SMTP_FROM`
      (when unset, email is silently disabled but login still works)

Multi-tenant:

- [ ] `TENANT_BASE_DOMAIN=zenex-sports.com`
- [ ] `PLATFORM_ADMIN_EMAILS=you@…,ops@…` — **required to use `/platform`**
- [ ] `DEFAULT_LEAGUE_SLUG=hkbankleague2026`, `DEFAULT_LEAGUE_ID=1`
- [ ] `TRIAL_DAYS=14` (0 = open-ended trial)
- [ ] `PLATFORM_HOSTS` only if extra console hostnames are needed
- [ ] `APP_BASE_URL` for canonical links in emails

Reference: `.env.example` is kept in sync with every `process.env.*` the code reads.

## 3. Database

- [ ] Confirm all migrations are applied. As of this writing **0010/0011/0012 are
      live**; there is no pending migration.
- [ ] Before any future migration: backup first. Use the Neon **direct** endpoint
      (strip `-pooler`), `PGSSLMODE=require`, and the homebrew `postgresql@18`
      binaries. Restore-test backups; do not trust `awk` row counts.
- [ ] RLS is `enabled` but **not forced** and the app role is the table owner
      (bypasses RLS). Enforcing RLS needs the serverless Pool + a `NOBYPASSRLS`
      role — a deliberate later step, not required for launch.

## 4. DNS / domains (Vercel + zenex-sports.com registrar)

- [ ] Apex first: add `zenex-sports.com` (+ `www`) in Vercel → Settings → Domains;
      create the A/CNAME records Vercel shows.
- [ ] Verify `https://zenex-sports.com/platform` loads (locked behind
      `PLATFORM_ADMIN_EMAILS`; others get 404).
- [ ] Wildcard last: add `*.zenex-sports.com` in Vercel and the DNS record
      `*.zenex-sports.com  CNAME  cname.vercel-dns.com`; wait for wildcard SSL.
- [ ] Provision a test league in `/platform`, then verify
      `https://{slug}.zenex-sports.com` serves only its own data.

## 5. Tenant provisioning smoke test (do one full cycle)

- [ ] Submit `/apply` for a throwaway league → 201; admin receives the
      notification email (check `reply-to` is the applicant).
- [ ] In `/platform`: review → approve → provision.
- [ ] Confirm a new `leagues` row exists with `status='trial'` and
      `trial_ends_at = now + TRIAL_DAYS`.
- [ ] **Auth isolation:** a league-A manager must **not** be able to log in on the
      league-B subdomain (host-bound login rejects the cross-tenant session).
- [ ] Data isolation: league-B fixture/player queries return only B rows; no
      league-#1 data appears.
- [ ] Trial lapse (set `trial_ends_at` in the past for the test league) → the
      subdomain shows the "試用期已完結" notice and queries return no rows; login
      is rejected. Restore/delete the test row afterwards.

## 6. Billing / lifecycle (still a product gap — decide before paid launch)

- [ ] No Stripe/billing integration exists. `plan` / `status` / `trial_ends_at`
      are columns only. Today a lapsed trial is auto-suspended by time check;
      converting trial→paid is a manual status flip in `/platform`.
- [ ] Decide: payment provider, plan list, what flips `trial` → `active`, and
      who receives renewal notices.

## 7. Security / hygiene

- [ ] `/api/init-db` and `/api/teams/init` are legacy bootstrap endpoints
      (ESLint-exempted). Disable or protect them before public launch.
- [ ] Rotate any secret that was ever committed; `.env*` stays gitignored.
- [ ] Rate limiting is on the public apply endpoint (5/h/IP). Re-check limits
      on login / forgot-password before marketing the sign-up page.

---

## Quick rollback

- Code: revert the Vercel deployment (founding league behaviour is unchanged
  until the wildcard domain exists).
- DNS: remove the wildcard record; the apex/vercel.app keep serving league #1.
- Data: every migration to date is additive (new column/table + dormant RLS);
  restore from the pre-change backup if needed.
