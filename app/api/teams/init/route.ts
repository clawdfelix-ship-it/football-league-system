import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { teams } from '@/lib/schema';

// POST /api/teams/init - Initialize teams table
export async function POST() {
  try {
    // Insert initial teams
    const initialTeams = [
      { name: 'NOMURA', homeKitColor: 'red', awayKitColor: 'white' },
      { name: 'BBVA', homeKitColor: 'blue', awayKitColor: 'white' },
      { name: 'LGT', homeKitColor: 'purple', awayKitColor: 'white' },
      { name: 'CACIB', homeKitColor: 'green', awayKitColor: 'white' },
      { name: 'CITI', homeKitColor: 'blue', awayKitColor: 'white' },
      { name: 'SCB', homeKitColor: 'red', awayKitColor: 'white' },
      { name: 'UBS', homeKitColor: 'yellow', awayKitColor: 'black' },
      { name: 'HSBC', homeKitColor: 'red', awayKitColor: 'white' },
      { name: 'KPMG', homeKitColor: 'indigo', awayKitColor: 'white' },
    ];

    for (const team of initialTeams) {
      await db.insert(teams).values(team).onConflictDoUpdate({
        target: teams.name,
        set: {
          homeKitColor: team.homeKitColor,
          awayKitColor: team.awayKitColor,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Teams initialized successfully' 
    });
  } catch (error) {
    console.error('Failed to initialize teams:', error);
    return NextResponse.json(
      { error: 'Failed to initialize teams', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/teams/init - Check teams table status
export async function GET() {
  try {
    const allTeams = await db.select().from(teams);
    
    return NextResponse.json({ 
      success: true,
      count: allTeams.length,
      message: allTeams.length > 0 ? 'Teams table exists with data' : 'Teams table is empty'
    });
  } catch (error) {
    console.error('Failed to check teams table:', error);
    return NextResponse.json(
      { error: 'Teams table does not exist', details: String(error) },
      { status: 500 }
    );
  }
}
