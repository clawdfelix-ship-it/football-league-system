import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

// POST /api/teams/init - Initialize teams table
export async function POST() {
  try {
    // Create teams table manually using raw SQL
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        home_kit_color VARCHAR(20) DEFAULT 'white',
        away_kit_color VARCHAR(20) DEFAULT 'black',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✓ teams table created');

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
    for (const team of initialTeams) {
      await db.execute(sql`
        INSERT INTO teams (name, home_kit_color, away_kit_color)
        VALUES (${team.name}, ${team.homeKitColor}, ${team.awayKitColor})
        ON CONFLICT (name) DO UPDATE SET
          home_kit_color = EXCLUDED.home_kit_color,
          away_kit_color = EXCLUDED.away_kit_color,
          updated_at = NOW()
      `);
      inserted++;
    }

    console.log(`✓ ${inserted} teams inserted/updated`);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully initialized ${inserted} teams`,
      count: inserted
    });
  } catch (error) {
    console.error('❌ Failed to initialize teams:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize teams', 
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// GET /api/teams/init - Check teams table status
export async function GET() {
  try {
    const result = await db.execute(sql`SELECT COUNT(*) FROM teams`);
    const count = (result.rows[0] as any)?.count || 0;
    
    return NextResponse.json({ 
      success: true,
      count: Number(count),
      message: Number(count) > 0 ? 'Teams table exists with data' : 'Teams table is empty'
    });
  } catch (error) {
    console.error('Failed to check teams table:', error);
    return NextResponse.json(
      { error: 'Teams table does not exist', details: String(error) },
      { status: 500 }
    );
  }
}
