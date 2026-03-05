'use server';

import { db } from './db';
import { matches, type Match, players, type Player } from './schema';
import { desc, eq, asc } from 'drizzle-orm';
import { TEAMS } from './constants';
import { put } from '@vercel/blob';

export type TeamStanding = {
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export async function getStandings(): Promise<TeamStanding[]> {
  const allMatches = await db.select().from(matches);
  
  const table = new Map<string, TeamStanding>();

  function ensureTeam(name: string) {
    if (!table.has(name)) {
      table.set(name, {
        teamName: name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
    }
    return table.get(name)!;
  }

  // Initialize all teams from constants to ensure they appear even without matches
  for (const team of TEAMS) {
    ensureTeam(team.name);
  }

  for (const match of allMatches) {
    if (match.status !== 'finished' || match.homeScore === null || match.awayScore === null) {
      continue;
    }

    const home = ensureTeam(match.homeTeam);
    const away = ensureTeam(match.awayTeam);

    home.played += 1;
    away.played += 1;

    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;
    
    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    if (match.homeScore > match.awayScore) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (match.homeScore < match.awayScore) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      home.points += 1;
      away.draws += 1;
      away.points += 1;
    }
  }

  const standings = Array.from(table.values());

  standings.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }
    return a.teamName.localeCompare(b.teamName);
  });

  return standings;
}

export async function getMatches(status?: 'scheduled' | 'finished' | 'tbc') {
  if (status) {
    return await db.select().from(matches).where(eq(matches.status, status)).orderBy(status === 'scheduled' ? asc(matches.date) : desc(matches.date));
  }
  return await db.select().from(matches).orderBy(desc(matches.date));
}

export async function addMatch(data: {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  date?: Date;
  venue?: string;
  status: 'scheduled' | 'finished' | 'tbc';
  round?: string;
}) {
  return await db.insert(matches).values(data).returning();
}

export async function updateMatch(id: number, data: {
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  date?: Date;
  venue?: string;
  status?: 'scheduled' | 'finished' | 'tbc';
  round?: string;
}) {
  return await db.update(matches).set(data).where(eq(matches.id, id)).returning();
}

export async function deleteMatch(id: number | string) {
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId)) throw new Error('Invalid match ID');
    
    await db.delete(matches).where(eq(matches.id, numericId));
    return { success: true };
  } catch (error) {
    console.error('Failed to delete match:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function resetSeason() {
  try {
    // Force direct delete
    const result = await db.delete(matches).returning();
    console.log(`Deleted ${result.length} matches`);
    return result;
  } catch (error) {
    console.error('Failed to reset season:', error);
    throw error;
  }
}

export async function getTeamPlayers(teamName: string) {
  try {
    const teamPlayers = await db
      .select()
      .from(players)
      .where(eq(players.team, teamName))
      .orderBy(asc(players.jerseyNumber));
    return teamPlayers;
  } catch (error) {
    console.error('Failed to get team players:', error);
    return [];
  }
}

export async function addPlayer(data: {
  name: string;
  team: string;
  number: number;
  position: string;
  identityPrefix?: string;
}) {
  try {
    // Check if player number already exists for this team
    const existingPlayer = await db.select().from(players).where(
      eq(players.team, data.team)
    );
    
    // Explicitly type 'p' as any to bypass implicit any error, or cast existingPlayer
    // Better yet, existingPlayer is inferred from schema, so p should be typed.
    // However, sometimes Drizzle inference needs help or TS config is strict.
    if (existingPlayer.some((p: any) => p.jerseyNumber === data.number)) {
      return { success: false, message: `Player with number ${data.number} already exists for team ${data.team}` };
    }

    const res = await db.insert(players).values({
      name: data.name,
      team: data.team,
      jerseyNumber: data.number,
      position: data.position,
      identityPrefix: data.identityPrefix,
    }).returning();
    
    return { success: true, player: res[0] };
  } catch (error) {
    console.error('Failed to add player:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deletePlayer(id: number | string) {
  try {
    // Ensure id is a number
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(numericId)) {
      return { success: false, message: 'Invalid player ID' };
    }

    await db.delete(players).where(eq(players.id, numericId));
    return { success: true };
  } catch (error) {
    console.error('Failed to delete player:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function uploadPlayerPhoto(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const playerId = formData.get('playerId') as string;
    
    if (!file || !playerId) {
      return { success: false, message: 'Missing file or player ID' };
    }
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('Missing BLOB_READ_WRITE_TOKEN');
      return { success: false, message: 'Server configuration error: Missing storage token' };
    }

    const blob = await put(file.name, file, {
      access: 'public',
    });

    await db
      .update(players)
      .set({ photoUrl: blob.url })
      .where(eq(players.id, parseInt(playerId)));

    return { success: true, url: blob.url };
  } catch (error) {
    console.error('Failed to upload player photo:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown upload error' };
  }
}
