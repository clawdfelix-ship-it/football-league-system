import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { teams } from '@/lib/schema';

// GET /api/teams/settings - Get all team settings
export async function GET() {
  try {
    const allTeams = await db.select().from(teams).orderBy(teams.name);
    
    return NextResponse.json({ teams: allTeams });
  } catch (error) {
    console.error('Failed to fetch team settings:', error);
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
    const { teamName, homeKitColor, awayKitColor } = body;

    if (!teamName || !homeKitColor || !awayKitColor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Try to update existing team
    const updated = await db
      .update(teams)
      .set({ homeKitColor, awayKitColor })
      .where(eq(teams.name, teamName))
      .returning();

    // If no rows updated, insert new team
    if (updated.length === 0) {
      await db.insert(teams).values({
        name: teamName,
        homeKitColor,
        awayKitColor,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Team kit colors updated successfully' 
    });
  } catch (error) {
    console.error('Failed to update team settings:', error);
    return NextResponse.json(
      { error: 'Failed to update team settings', details: String(error) },
      { status: 500 }
    );
  }
}
