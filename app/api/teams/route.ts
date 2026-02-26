import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { matches } from '@/lib/schema';

const TEAM_NAMES = ['NOMURA', 'BBVA', 'LGT', 'CACIB', 'CITI', 'SCB', 'UBS'];

function generateSampleMatches() {
  const sampleMatches = [];
  const venues = ['香港足球會足球場', '九龍仔公園足球場', '蒲崗村道足球場', '將軍澳足球場'];
  
  // Generate some matches
  const matchConfigs = [
    { home: 'NOMURA', away: 'BBVA', homeScore: 2, awayScore: 1 },
    { home: 'CITI', away: 'SCB', homeScore: 3, awayScore: 0 },
    { home: 'UBS', away: 'LGT', homeScore: 1, awayScore: 1 },
    { home: 'CACIB', away: 'NOMURA', homeScore: 0, awayScore: 2 },
    { home: 'BBVA', away: 'CITI', homeScore: 1, awayScore: 1 },
    { home: 'SCB', away: 'UBS', homeScore: 0, awayScore: 3 },
    { home: 'LGT', away: 'CACIB', homeScore: 2, awayScore: 0 },
    { home: 'NOMURA', away: 'SCB', homeScore: null, awayScore: null, status: 'scheduled' },
    { home: 'CITI', away: 'UBS', homeScore: null, awayScore: null, status: 'scheduled' },
    { home: 'LGT', away: 'BBVA', homeScore: null, awayScore: null, status: 'scheduled' },
  ];

  const now = new Date();
  
  for (let i = 0; i < matchConfigs.length; i++) {
    const config = matchConfigs[i];
    const matchDate = config.status === 'scheduled' 
      ? new Date(now.getTime() + (i + 1) * 7 * 24 * 60 * 60 * 1000) // Future dates for scheduled
      : new Date(now.getTime() - (i + 1) * 3 * 24 * 60 * 60 * 1000); // Past dates for finished
    
    sampleMatches.push({
      homeTeam: config.home,
      awayTeam: config.away,
      homeScore: config.homeScore,
      awayScore: config.awayScore,
      date: matchDate,
      venue: venues[i % venues.length],
      status: config.status || 'finished',
    });
  }
  
  return sampleMatches;
}

// GET - Get all teams
export async function GET() {
  try {
    // Check if matches exist
    const existingMatches = await db.select().from(matches);
    
    if (existingMatches.length === 0) {
      // Generate and insert sample matches
      const sampleMatches = generateSampleMatches();
      await db.insert(matches).values(sampleMatches);
      return NextResponse.json({ 
        message: '已添加範例賽事', 
        matches: sampleMatches.length 
      });
    }
    
    return NextResponse.json({ 
      teams: TEAM_NAMES,
      matchCount: existingMatches.length 
    });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

// POST - Add sample matches (for testing)
export async function POST() {
  try {
    // Clear existing matches and add fresh ones
    await db.delete(matches);
    const sampleMatches = generateSampleMatches();
    await db.insert(matches).values(sampleMatches);
    
    return NextResponse.json({ 
      message: '已添加範例賽事', 
      matches: sampleMatches.length,
      teams: TEAM_NAMES
    });
  } catch (error) {
    console.error('Failed to add sample matches:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
