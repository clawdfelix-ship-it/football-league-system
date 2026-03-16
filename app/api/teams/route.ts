import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { matches } from '@/lib/schema';
import { TEAMS } from '@/lib/constants';

// GET - Get all teams
export async function GET() {
  try {
    return NextResponse.json({ 
      teams: TEAMS.map(t => t.name)
    });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

// POST - Reset all matches (clear data)
export async function POST() {
  try {
    // Delete all matches
    await db.delete(matches);
    
    return NextResponse.json({ 
      message: '數據已清除' 
    });
  } catch (error) {
    console.error('Failed to reset:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
