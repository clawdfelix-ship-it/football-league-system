import { ok, fail } from '@/lib/api/response';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { getAuthContext } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
    }
    if (auth.role !== 'admin') {
      return fail(403, 'FORBIDDEN', 'Forbidden');
    }

    // Create teams table manually using raw SQL. After multi-tenant migration
// 0010 the unique key is (league_id, name), not name alone; this bootstrap
// creates the current-shape table and scopes seed rows to the request league.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        league_id INTEGER NOT NULL DEFAULT 1 REFERENCES leagues(id) ON DELETE CASCADE,
        home_kit_color VARCHAR(20) DEFAULT 'white',
        away_kit_color VARCHAR(20) DEFAULT 'black',
        short_name VARCHAR(20),
        name_zh VARCHAR(200),
        color_gradient VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(league_id, name)
      )
    `);

    // Insert initial teams with specific colors
    const initialTeams = [
      { name: 'NOMURA', homeKitColor: 'red', awayKitColor: 'grey' },     // Home: Red, Away: Grey
      { name: 'BBVA', homeKitColor: 'blue', awayKitColor: 'white' },       // Home: Blue, Away: White
      { name: 'LGT', homeKitColor: 'red-blue', awayKitColor: 'white' },    // Home: Red+Blue (split), Away: White
      { name: 'CACIB', homeKitColor: 'white-green', awayKitColor: 'grey' }, // Home: White+Green (split), Away: Grey
      { name: 'CITI', homeKitColor: 'white', awayKitColor: 'X' },            // Home: White, Away: Undecided
      { name: 'SCB', homeKitColor: 'navy', awayKitColor: 'white' },          // Home: Navy, Away: White
      { name: 'UBS', homeKitColor: 'white', awayKitColor: 'black' },         // Home: White, Away: Black
      { name: 'HSBC', homeKitColor: 'red', awayKitColor: 'navy' },          // Home: Red, Away: Navy
      { name: 'KPMG', homeKitColor: 'blue', awayKitColor: 'white' },         // Home: Blue, Away: White
    ];

    let inserted = 0;
    const { getRequestLeagueId } = await import('@/lib/tenant/context');
    const leagueId = await getRequestLeagueId();
    for (const team of initialTeams) {
      await db.execute(sql`
        INSERT INTO teams (league_id, name, home_kit_color, away_kit_color)
        VALUES (${leagueId}, ${team.name}, ${team.homeKitColor}, ${team.awayKitColor})
        ON CONFLICT (league_id, name) DO UPDATE SET
          home_kit_color = EXCLUDED.home_kit_color,
          away_kit_color = EXCLUDED.away_kit_color,
          updated_at = NOW()
      `);
      inserted++;
    }

    return ok({
      message: `Successfully initialized ${inserted} teams`,
      count: inserted,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return fail(500, 'INTERNAL_ERROR', 'Failed to initialize teams', errorMessage);
  }
}

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
    }
    if (auth.role !== 'admin') {
      return fail(403, 'FORBIDDEN', 'Forbidden');
    }

    const result = await db.execute(sql`SELECT COUNT(*) FROM teams`);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    const countRaw = row?.count;
    const count = typeof countRaw === 'string' || typeof countRaw === 'number' ? Number(countRaw) : 0;

    return ok({
      count,
      message: count > 0 ? 'Teams table exists with data' : 'Teams table is empty',
    });
  } catch (error) {
    return fail(500, 'INTERNAL_ERROR', 'Teams table does not exist', String(error));
  }
}
