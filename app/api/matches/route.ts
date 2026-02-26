import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { matches } from '@/lib/schema';
import { desc, eq, asc } from 'drizzle-orm';

// GET all matches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let allMatches;
    
    if (status) {
      allMatches = await db
        .select()
        .from(matches)
        .where(eq(matches.status, status))
        .orderBy(status === 'scheduled' ? asc(matches.date) : desc(matches.date));
    } else {
      allMatches = await db.select().from(matches).orderBy(desc(matches.date));
    }
    
    return NextResponse.json({ matches: allMatches });
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    return NextResponse.json({ message: 'Failed to fetch matches' }, { status: 500 });
  }
}

// POST - Add new match
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.homeTeam || !body.awayTeam || !body.date) {
      return NextResponse.json(
        { message: 'homeTeam, awayTeam and date are required' },
        { status: 400 }
      );
    }
    
    const newMatch = await db.insert(matches).values({
      homeTeam: body.homeTeam,
      awayTeam: body.awayTeam,
      homeScore: body.homeScore || null,
      awayScore: body.awayScore || null,
      date: new Date(body.date),
      venue: body.venue || 'TBC',
      status: body.status || 'scheduled',
    }).returning();
    
    return NextResponse.json({ match: newMatch[0] });
  } catch (error) {
    console.error('Failed to add match:', error);
    return NextResponse.json({ message: 'Failed to add match' }, { status: 500 });
  }
}
