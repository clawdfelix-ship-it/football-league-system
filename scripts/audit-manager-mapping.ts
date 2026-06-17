import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { writeFile } from 'node:fs/promises';
import { db } from '../lib/db';
import { users } from '../lib/schema';
import { resolveManagerTeamId } from '../lib/auth';
import { TEAMS } from '../lib/constants';

function teamLabel(teamId: number | null) {
  if (teamId === null) return null;
  const team = TEAMS[teamId];
  if (!team) return null;
  return `${team.shortName} (${team.nameZh})`;
}

async function main() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
  if (!hasDbUrl) {
    console.error('Missing DATABASE_URL / POSTGRES_URL. Cannot audit users table.');
    process.exitCode = 1;
    return;
  }

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, 'manager'))
    .orderBy(users.email);

  const audited = rows.map((u) => {
    const email = u.email.toLowerCase();
    const teamId = resolveManagerTeamId(email);
    const label = teamLabel(teamId);
    return {
      id: u.id,
      email,
      username: u.username,
      teamId,
      team: label,
      status: teamId === null ? 'MISSING_TEAM_MAPPING' : 'OK',
      createdAt: u.createdAt,
    };
  });

  const missing = audited.filter((x) => x.status !== 'OK');

  const result = { total: audited.length, ok: audited.length - missing.length, missing: missing.length, audited };
  await writeFile('audit-manager-mapping.json', `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log('Wrote audit-manager-mapping.json');
}

main().catch((e) => {
  console.error('Audit failed:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
