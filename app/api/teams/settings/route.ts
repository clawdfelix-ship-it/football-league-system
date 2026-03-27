import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

// GET /api/teams/settings - Get all team settings
export async function GET() {
  try {
    const result = await db.execute(sql`
      SELECT id, name, home_kit_color, away_kit_color, created_at, updated_at 
      FROM teams 
      ORDER BY name
    `);
    
    console.log('📦 GET /api/teams/settings - 返回:', result.rows.length, '支球隊');
    
    return NextResponse.json({ teams: result.rows });
  } catch (error) {
    console.error('❌ Failed to fetch team settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team settings', details: String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/teams/settings - Update team kit colors
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    let { teamName, homeKitColor, awayKitColor } = body;

    console.log('💾 PUT /api/teams/settings - 接收:', { teamName, homeKitColor, awayKitColor });

    if (!teamName || !homeKitColor || !awayKitColor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Normalize team name
    teamName = teamName.trim().toUpperCase();

    // Update or insert team
    const result = await db.execute(sql`
      INSERT INTO teams (name, home_kit_color, away_kit_color, created_at, updated_at)
      VALUES (${teamName}, ${homeKitColor}, ${awayKitColor}, NOW(), NOW())
      ON CONFLICT (name) DO UPDATE SET
        home_kit_color = EXCLUDED.home_kit_color,
        away_kit_color = EXCLUDED.away_kit_color,
        updated_at = NOW()
      RETURNING *
    `);

    console.log('✅ 儲存成功:', result.rows[0]);

    return NextResponse.json({ 
      success: true, 
      message: 'Team kit colors updated successfully',
      team: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Failed to update team settings:', error);
    return NextResponse.json(
      { error: 'Failed to update team settings', details: String(error) },
      { status: 500 }
    );
  }
}
