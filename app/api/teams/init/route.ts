import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

// POST /api/teams/init - Initialize teams table
export async function POST() {
  try {
    // Create teams table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        home_kit_color VARCHAR(20) DEFAULT 'white',
        away_kit_color VARCHAR(20) DEFAULT 'black'
      )
    `);

    // Insert initial teams
    await db.execute(sql`
      INSERT INTO teams (name, home_kit_color, away_kit_color) VALUES
        ('NOMURA', 'red', 'white'),
        ('BBVA', 'blue', 'white'),
        ('LGT', 'purple', 'white'),
        ('CACIB', 'green', 'white'),
        ('CITI', 'blue', 'white'),
        ('SCB', 'red', 'white'),
        ('UBS', 'yellow', 'black'),
        ('HSBC', 'red', 'white'),
        ('KPMG', 'indigo', 'white')
      ON CONFLICT (name) DO UPDATE SET
        home_kit_color = EXCLUDED.home_kit_color,
        away_kit_color = EXCLUDED.away_kit_color
    `);

    return NextResponse.json({ 
      success: true, 
      message: 'Teams table initialized successfully' 
    });
  } catch (error) {
    console.error('Failed to initialize teams table:', error);
    return NextResponse.json(
      { error: 'Failed to initialize teams table', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/teams/init - Check if teams table exists
export async function GET() {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'teams'
      ) as table_exists
    `);
    
    const tableExists = (result.rows[0] as any)?.table_exists || false;
    
    return NextResponse.json({ 
      tableExists,
      message: tableExists ? 'Teams table exists' : 'Teams table does not exist'
    });
  } catch (error) {
    console.error('Failed to check teams table:', error);
    return NextResponse.json(
      { error: 'Failed to check teams table', details: String(error) },
      { status: 500 }
    );
  }
}
