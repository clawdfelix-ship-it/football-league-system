import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { matches } from '@/lib/schema';

const TEAM_NAMES = ['NOMURA', 'BBVA', 'LGT', 'CACIB', 'CITI', 'SCB', 'UBS'];

// GET - Get all teams
export async function GET() {
  try {
    return NextResponse.json({ 
      teams: TEAM_NAMES
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
