/**
 * One-off migration: TEAM_CONTACTS (hardcoded) → teams table contact columns.
 * Run: npx tsx scripts/migrate-team-contacts.ts
 * Safe to re-run (idempotent by team name).
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { teams } from '../lib/schema';
import { TEAM_CONTACTS } from '../lib/team-contacts';

const envContent = fs.readFileSync(path.join(process.cwd(), '.vercel/.env.production.local'), 'utf8');
const dbUrl = envContent.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
if (!dbUrl) {
  console.error('DATABASE_URL not found in .vercel/.env.production.local');
  process.exit(1);
}

const db = drizzle(neon(dbUrl));

async function migrate() {
  console.log(`Migrating ${TEAM_CONTACTS.length} TEAM_CONTACTS entries to teams table...`);

  for (const tc of TEAM_CONTACTS) {
    const [existing] = await db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .where(and(eq(teams.leagueId, 1), eq(teams.name, tc.team)))
      .limit(1);

    if (!existing) {
      console.log(`  ⚠️  Not found in DB, skipping: ${tc.team}`);
      continue;
    }

    await db
      .update(teams)
      .set({
        nameZh: tc.teamZh || null,
        color: tc.color || null,
        venue: tc.venue || null,
        coach: tc.coach || null,
        manager: tc.manager || null,
        captains: tc.captains || null,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, existing.id));

    console.log(`  ✅ ${tc.team} (id=${existing.id})`);
  }

  console.log('Done.');
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
