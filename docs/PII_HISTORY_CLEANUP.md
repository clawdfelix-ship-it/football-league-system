# ⚠️  PII Git History Cleanup — DO NOT BLINDLY RUN

Real PII (manager emails, captain phone numbers, corporate contact info) lived
in `lib/auth.ts` and `lib/team-contacts.ts` in earlier commits. Although the
code has been refactored to load PII from gitignored / env sources, **the
historical commits still contain those email addresses**.

This file explains the options. Pick one and execute it manually. None of these
commands have been run.

---

## Why this matters

If the GitHub repository is public (or has ever been public), the historical
commits are publicly browsable at the original URLs even after the source files
are sanitized. A `git clone` of any tag or older commit will reproduce the old
`lib/auth.ts` with the full email map.

## Option A — Full rewrite with `git filter-repo` (recommended)

```bash
# Install once: brew install git-filter-repo

cd football-league-system

# 1. Back up your work first
cp -R football-league-system football-league-system.bak

# 2. Remove the offending files from EVERY commit
git filter-repo --invert-paths \
  --path lib/auth.ts \
  --path lib/team-contacts.ts \
  --force

# 3. Rewrite commit messages / content if any sensitive strings leaked into
#    other files (e.g. README, .env.example, scripts/audit-manager-mapping.ts).
#    Use --blob-callback or --message-callback as needed.

# 4. Re-add sanitized replacements on top of the rewritten history
git add lib/auth/manager-mapping.example.ts lib/auth/load-manager-mapping.ts
git commit -m "feat(auth): move manager mapping to gitignored server file"

# 5. Re-add a sanitized team-contacts.ts (e.g. with placeholder phone numbers)
#    so the /contacts page still renders
git add lib/team-contacts.ts
git commit -m "feat(contacts): sanitize team contact info; redaction rules in place"

# 6. Force push — required because history was rewritten
git remote add origin https://github.com/clawdfelix-ship-it/football-league-system.git
git push --force-with-lease origin main
```

After force-push, all clones (and GitHub's web UI for older commits) will no
longer contain the original PII strings.

### Caveats

- All existing clones become divergent and need a fresh `git clone`.
- Any open PRs from forks will need to be rebased manually.
- Force-push to `main` is destructive — coordinate with collaborators first.

---

## Option B — Add `.gitignore` retroactive without rewriting history

If you want to keep history intact but discourage further leaks:

```bash
# Just commit the .gitignore update and the new loader files.
# Files already in history remain visible on GitHub for old commits.
git add .gitignore lib/auth/
git commit -m "feat(auth): move manager mapping to gitignored server file"
git push origin main
```

This is what `current commit HEAD` already contains. It prevents *new* commits
from adding PII but does not scrub historical commits.

---

## Option C — Nuke and recreate

```bash
# 1. Save the current state
cp -R football-league-system football-league-system.lastgood

# 2. Delete the GitHub repo via the Settings UI ("Danger Zone").

# 3. Re-create the repo as a fresh empty git project, then push sanitized
#    commits only.
cd football-league-system
rm -rf .git
git init
git remote add origin https://github.com/clawdfelix-ship-it/football-league-system.git
git add .
git commit -m "Initial commit (sanitized)"
git push -u origin main
```

Cleanest result, but loses all commit history (issues / PRs that reference
specific commits will break).

---

## What's already sanitized in the working tree

| Path | Status |
|------|--------|
| `lib/auth.ts` | Hard-coded `MANAGER_EMAILS` replaced by Proxy → `load-manager-mapping.ts` (gitignored file or env var) |
| `lib/auth/manager-mapping.server.ts` | Exists, empty stub, gitignored. Paste real mappings here locally. |
| `lib/auth/manager-mapping.example.ts` | Empty placeholder, public. |
| `lib/auth/load-manager-mapping.ts` | 3-tier loader (env → gitignored file → placeholder). |
| `lib/team-contacts.ts` | ⚠️ **NOT YET sanitized** — still contains real names + emails + phones. |

---

## Decision needed from user

Felix should pick **A**, **B**, or **C** above. None of the destructive
commands will be auto-executed.