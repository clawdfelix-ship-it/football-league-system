import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

// GET /api/teams/settings - Get all team settings
export async function GET() {
  try {
    const teams = await db.execute(sql`
      SELECT id, name, home_kit_color, away_kit_color 
      FROM teams 
      ORDER BY name
    `);
    
    return NextResponse.json({ teams: teams.rows || [] });
  } catch (error) {
    console.error('Failed to fetch team settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team settings' },
      { status: 500 }
    );
  }
}

// PUT /api/teams/settings - Update team kit colors
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamName, homeKitColor, awayKitColor } = body;

    if (!teamName || !homeKitColor || !awayKitColor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await db.execute(sql`
      INSERT INTO teams (name, home_kit_color, away_kit_color)
      VALUES (${teamName}, ${homeKitColor}, ${awayKitColor})
      ON CONFLICT (name) DO UPDATE SET
        home_kit_color = EXCLUDED.home_kit_color,
        away_kit_color = EXCLUDED.away_kit_color
    `);

    return NextResponse.json({ 
      success: true, 
      message: 'Team kit colors updated successfully' 
    });
  } catch (error) {
    console.error('Failed to update team settings:', error);
    return NextResponse.json(
      { error: 'Failed to update team settings' },
      { status: 500 }
    );
  }
}
