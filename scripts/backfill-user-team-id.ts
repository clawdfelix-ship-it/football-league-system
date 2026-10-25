/**
 * One-off migration: backfill users.team_id for existing managers.
 * Run: npx tsx scripts/backfill-user-team-id.ts
 * Safe to re-run (idempotent — skips users that already have team_id set).
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, isNull, asc } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { users, teams } from '../lib/schema';

const envContent = fs.readFileSync(
  path.join(process.cwd(), '.vercel/.env.production.local'),
  'utf8'
);
const dbUrl = envContent.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
if (!dbUrl) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const db = drizzle(neon(dbUrl));

async function backfill() {
  // Get all teams ordered by id (same order as array index)
  const allTeams = await db
    .select({ id: teams.id, name: teams.name, shortName: teams.shortName })
    .from(teams)
    .where(eq(teams.leagueId, 1))
    .orderBy(asc(teams.id));

  console.log(`Found ${allTeams.length} teams in DB`);

  // Get all managers with team_id IS NULL
  const managers = await db
    .select({ id: users.id, email: users.email, username: users.username, leagueId: users.leagueId })
    .from(users)
    .where(and(eq(users.role, 'manager'), isNull(users.teamId)));

  console.log(`Found ${managers.length} managers with team_id IS NULL`);

  let migrated = 0;
  let skipped = 0;

  for (const m of managers) {
    // Username format: "<team>-<email-local>" (from makeUsername). Extract the prefix.
    // e.g. "nomura-terrence.tan" → "NOMURA"
    const usernamePrefix = (m.username ?? '').split('-')[0]?.toUpperCase();
    if (!usernamePrefix) {
      console.log(`  ⚠️  ${m.email} (username=${m.username}): no prefix, skipping`);
      skipped++;
      continue;
    }

    const team = allTeams.find((t) => t.shortName === usernamePrefix || t.name === usernamePrefix);
    if (!team) {
      console.log(`  ⚠️  ${m.email} (username=${m.username}): prefix "${usernamePrefix}" not found in teams, skipping`);
      skipped++;
      continue;
    }

    await db
      .update(users)
      .set({ teamId: team.id })
      .where(eq(users.id, m.id));

    console.log(`  ✅ ${m.email} → ${team.name} (team_id=${team.id})`);
    migrated++;
  }

  console.log(`\nDone: ${migrated} migrated, ${skipped} skipped`);
}

backfill().catch((e) => {
  console.error(e);
  process.exit(1);
});
