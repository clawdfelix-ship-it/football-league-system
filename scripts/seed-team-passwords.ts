/**
 * seed-team-passwords.ts
 *
 * One-time script to generate per-team manager passwords and seed them into
 * the users table. Run AFTER running the 0008 migration:
 *
 *   cd football-league-system
 *   npx tsx scripts/seed-team-passwords.ts
 *
 * The script:
 *   1. For each of the 10 teams, generates a random 12-char password
 *      (uppercase letters + digits, easy to read on WhatsApp).
 *   2. bcrypt-hashes the password at 12 rounds.
 *   3. Upserts the manager row for each team's captain emails (taken from
 *      lib/team-contacts.ts — the existing single source of truth).
 *   4. Sets must_change_password = now() so first login forces a change.
 *   5. Prints the PLAINTEXT passwords ONCE to stdout with team labels.
 *
 * After running, the admin must capture these passwords and deliver each one
 * to the corresponding team manager (WhatsApp / in-person). The script
 * never re-runs the same plaintext — to reset a single password, use the
 * /admin/team-passwords UI.
 *
 * ⚠️  This script will SKIP any team that already has a row in the users
 *     table. Re-run only after explicitly resetting those rows.
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { inArray } from 'drizzle-orm';
import { TEAM_CONTACTS } from '../lib/team-contacts';
import { db } from '../lib/db';
import { users } from '../lib/schema';

function makePassword(): string {
  // 12 chars, uppercase letters + digits, no 0/O/1/I confusion.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 12; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  // Format as XXX-XXX-XXX-XXX for WhatsApp legibility.
  return `${out.slice(0, 3)}-${out.slice(3, 6)}-${out.slice(6, 9)}-${out.slice(9, 12)}`;
}

function makeUsername(team: string, email: string) {
  const local = email.split('@')[0] || email;
  const base = `${team}-${local}`.toLowerCase();
  return base.length <= 50 ? base : base.slice(0, 50);
}

async function main() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  if (!hasDbUrl) {
    console.error('Missing DATABASE_URL / POSTGRES_URL.');
    process.exitCode = 1;
    return;
  }

  const teams = TEAM_CONTACTS.filter((t) => t.team !== 'DEMO');
  const now = new Date();

  // Pre-check: see which teams already have a manager row.
  const allCaptainEmails = teams.flatMap((t) =>
    t.captains.map((c) => (c.email ?? '').toLowerCase()).filter((e) => e.length > 0)
  );
  const existingRows = allCaptainEmails.length > 0
    ? await db
        .select({ email: users.email })
        .from(users)
        .where(inArray(users.email, allCaptainEmails))
    : [];
  const existingEmails = new Set(existingRows.map((r) => r.email.toLowerCase()));

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Team manager password seed — DELIVER EACH PASSWORD SECURELY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  let created = 0;
  let skipped = 0;
  const issuedPasswords: Array<{ team: string; email: string; password: string }> = [];

  for (const teamBlock of teams) {
    for (const captain of teamBlock.captains) {
      const captainEmail = captain.email;
      if (!captainEmail) continue;
      const email = captainEmail.toLowerCase().trim();

      if (existingEmails.has(email)) {
        skipped++;
        console.log(`  [skip]  ${teamBlock.team.padEnd(8)} ${email}  (already has account)`);
        continue;
      }

      const password = makePassword();
      const passwordHash = await bcrypt.hash(password, 12);

      await db.insert(users).values({
        email,
        username: makeUsername(teamBlock.team, email),
        passwordHash,
        role: 'manager',
        mustChangePassword: now,
      });

      issuedPasswords.push({ team: teamBlock.team, email, password });
      created++;
      console.log(`  [new]   ${teamBlock.team.padEnd(8)} ${email}  password = ${password}`);
    }
  }

  console.log('');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  Created: ${created}    Skipped (already exists): ${skipped}`);
  console.log('');
  if (issuedPasswords.length > 0) {
    console.log('  ⚠️  Copy the passwords above to your team managers NOW.');
    console.log('  ⚠️  This output is NOT saved. Re-run only resets new accounts.');
    console.log('  ⚠️  Each manager will be forced to set a new password on first login.');
  }
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
}

main().catch((e) => {
  console.error('Seed failed:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});