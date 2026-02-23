import { prisma } from "@/lib/db";

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
  // Mock data for development
  const mockMatches = [
    {
      id: 1,
      homeTeam: "曼城",
      awayTeam: "利物浦",
      homeScore: 2,
      awayScore: 1,
      date: "2026-02-20",
      status: "finished",
    },
    {
      id: 2,
      homeTeam: "阿森納",
      awayTeam: "切爾西",
      homeScore: 1,
      awayScore: 1,
      date: "2026-02-21",
      status: "finished",
    },
    {
      id: 3,
      homeTeam: "利物浦",
      awayTeam: "阿森納",
      homeScore: 3,
      awayScore: 0,
      date: "2026-02-22",
      status: "finished",
    },
    {
      id: 4,
      homeTeam: "切爾西",
      awayTeam: "曼城",
      homeScore: 1,
      awayScore: 2,
      date: "2026-02-23",
      status: "finished",
    },
  ];

  const matches = mockMatches;

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

  for (const match of matches) {
    if (match.homeScore === null || match.awayScore === null) {
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
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const team of table.values()) {
    team.goalDifference = team.goalsFor - team.goalsAgainst;
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

