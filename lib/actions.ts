import { db } from './db';
import { matches, type Match } from './schema';
import { desc, eq, asc } from 'drizzle-orm';

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

export async function getMatches(status?: 'scheduled' | 'finished') {
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
  date: Date;
  venue?: string;
  status: 'scheduled' | 'finished';
}) {
  return await db.insert(matches).values(data).returning();
}