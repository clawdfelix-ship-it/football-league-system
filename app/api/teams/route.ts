import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { matches } from '@/lib/schema';
import { TEAMS } from '@/lib/constants';

// GET - Get all teams
export async function GET() {
  try {
    return NextResponse.json({ 
      teams: TEAMS.filter(t => t.name !== 'DEMO').map(t => t.name)
    });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

// POST - Reset all matches (clear data) - Admin only
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
    }

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
