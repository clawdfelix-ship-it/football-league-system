'use server';

import { db } from './db';
import { matches, players } from './schema';
import { eq } from 'drizzle-orm';
import { TEAMS } from './constants';
import { put } from '@vercel/blob';
import { getAuthContext, getTeamNameFromTeamId } from '@/lib/authz';
import {
  createAnnouncement,
  createMatch,
  deleteAllMatches,
  deleteAnnouncementById,
  deleteMatchById,
  deletePlayerById,
  getPlayerTeamById,
  listPlayers,
  listPlayersByTeam,
  setPlayerPhotoUrlById,
  updatePlayerById,
  listAnnouncements,
  listMatches,
  listTeamSettings,
  updateMatchById,
} from '@/lib/queries';

export type TeamKitSettings = {
  name: string;
  homeKitColor: string;
  awayKitColor: string;
};

function normalizeTeamName(teamName: string | null | undefined) {
  return (teamName ?? '').trim().toUpperCase();
}

async function getPlayerMutationScope() {
  const auth = await getAuthContext();
  if (!auth) {
    return { ok: false as const, message: 'Unauthorized' };
  }

  if (auth.role === 'admin') {
    return { ok: true as const, role: 'admin' as const, teamName: null };
  }

  const managerTeamName = getTeamNameFromTeamId(auth.teamId);
  if (!managerTeamName) {
    return { ok: false as const, message: 'Forbidden' };
  }

  return { ok: true as const, role: 'manager' as const, teamName: managerTeamName };
}

export async function getTeamKitSettingsMap(): Promise<Record<string, TeamKitSettings>> {
  try {
    const rows = await listTeamSettings();

    const map: Record<string, TeamKitSettings> = {};
    for (const t of rows) {
      const key = (t.name ?? '').trim().toUpperCase();
      if (!key) continue;
      map[key] = {
        name: t.name,
        homeKitColor: t.homeKitColor ?? 'white',
        awayKitColor: t.awayKitColor ?? 'black',
      };
    }
    return map;
  } catch (error) {
    console.error('Failed to fetch team kit settings:', error);
    return {};
  }
}

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
  return await listMatches(status);
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
  return await createMatch({
    homeTeam: data.homeTeam,
    awayTeam: data.awayTeam,
    homeScore: data.homeScore ?? null,
    awayScore: data.awayScore ?? null,
    date: data.date ?? null,
    venue: data.venue ?? null,
    status: data.status,
    round: data.round ?? null,
  });
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
  return await updateMatchById(id, {
    ...data,
    date: data.date ?? undefined,
  });
}

export async function deleteMatch(id: number | string) {
  try {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId)) throw new Error('Invalid match ID');
    
    await deleteMatchById(numericId);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete match:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function resetSeason() {
  try {
    const result = await deleteAllMatches();
    console.log(`Deleted ${result.length} matches`);
    return result;
  } catch (error) {
    console.error('Failed to reset season:', error);
    throw error;
  }
}

export async function getTeamPlayers(teamName: string) {
  try {
    return await listPlayersByTeam(teamName);
  } catch (error) {
    console.error('Failed to get team players:', error);
    return [];
  }
}

export async function getAllPlayers() {
  try {
    return await listPlayers();
  } catch (error) {
    console.error('Failed to get all players:', error);
    return [];
  }
}

export async function addPlayer(data: {
  name: string;
  team: string;
  number: number;
  position: string;
  identityPrefix?: string;
  email?: string;
}) {
  try {
    const scope = await getPlayerMutationScope();
    if (!scope.ok) {
      return { success: false, message: scope.message };
    }

    const teamName = data.team.trim();
    if (!teamName) {
      return { success: false, message: 'Team is required' };
    }

    if (scope.role === 'manager' && normalizeTeamName(scope.teamName) !== normalizeTeamName(teamName)) {
      return { success: false, message: 'Forbidden' };
    }

    if (!Number.isInteger(data.number) || data.number < 0 || data.number > 99) {
      return { success: false, message: 'Invalid jersey number' };
    }

    const identityPrefix = data.identityPrefix?.trim().toUpperCase();
    if (identityPrefix && identityPrefix.length > 3) {
      return { success: false, message: 'Identity prefix must be 3 characters or fewer' };
    }

    // Check if player number already exists for this team
    const existingPlayer = await db.select().from(players).where(
      eq(players.team, teamName)
    );
    
    if (existingPlayer.some((p) => p.jerseyNumber === data.number)) {
      return { success: false, message: `Player with number ${data.number} already exists for team ${teamName}` };
    }

    const res = await db.insert(players).values({
      name: data.name,
      team: teamName,
      jerseyNumber: data.number,
      position: data.position,
      identityPrefix: identityPrefix || undefined,
      email: data.email?.trim() || undefined,
    }).returning();
    
    return { success: true, player: res[0] };
  } catch (error) {
    console.error('Failed to add player:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deletePlayer(id: number | string) {
  try {
    const scope = await getPlayerMutationScope();
    if (!scope.ok) {
      return { success: false, message: scope.message };
    }

    // Ensure id is a number
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(numericId)) {
      return { success: false, message: 'Invalid player ID' };
    }

    if (scope.role === 'manager') {
      const playerTeam = await getPlayerTeamById(numericId);
      if (!playerTeam || normalizeTeamName(playerTeam) !== normalizeTeamName(scope.teamName)) {
        return { success: false, message: 'Forbidden' };
      }
    }

    await deletePlayerById(numericId);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete player:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updatePlayer(id: number | string, data: {
  name?: string;
  number?: number;
  position?: string;
  phoneNumber?: string;
  email?: string;
  identityPrefix?: string;
}) {
  try {
    const scope = await getPlayerMutationScope();
    if (!scope.ok) {
      return { success: false, message: scope.message };
    }

    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

    if (isNaN(numericId)) {
      return { success: false, message: 'Invalid player ID' };
    }

    const playerTeam = await getPlayerTeamById(numericId);
    if (!playerTeam) {
      return { success: false, message: 'Player not found' };
    }

    if (scope.role === 'manager' && normalizeTeamName(playerTeam) !== normalizeTeamName(scope.teamName)) {
      return { success: false, message: 'Forbidden' };
    }

    if (data.number !== undefined && (!Number.isInteger(data.number) || data.number < 0 || data.number > 99)) {
      return { success: false, message: 'Invalid jersey number' };
    }

    const identityPrefix = data.identityPrefix?.trim().toUpperCase();
    if (identityPrefix && identityPrefix.length > 3) {
      return { success: false, message: 'Identity prefix must be 3 characters or fewer' };
    }

    const player = await updatePlayerById(numericId, {
      name: data.name,
      jerseyNumber: data.number,
      position: data.position,
      phoneNumber: data.phoneNumber?.trim() || undefined,
      email: data.email?.trim() || undefined,
      identityPrefix: identityPrefix || undefined,
    });

    if (!player) return { success: false, message: 'Player not found' };
    return { success: true, player };
  } catch (error) {
    console.error('Failed to update player:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function uploadPlayerPhoto(formData: FormData) {
  try {
    const scope = await getPlayerMutationScope();
    if (!scope.ok) {
      return { success: false, message: scope.message };
    }

    const file = formData.get('file') as File;
    const playerId = formData.get('playerId') as string;
    
    if (!file || !playerId) {
      return { success: false, message: 'Missing file or player ID' };
    }

    const numericPlayerId = parseInt(playerId, 10);
    if (isNaN(numericPlayerId)) {
      return { success: false, message: 'Invalid player ID' };
    }

    const playerTeam = await getPlayerTeamById(numericPlayerId);
    if (!playerTeam) {
      return { success: false, message: 'Player not found' };
    }

    if (scope.role === 'manager' && normalizeTeamName(playerTeam) !== normalizeTeamName(scope.teamName)) {
      return { success: false, message: 'Forbidden' };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, message: 'Only JPG, PNG, GIF, and WebP files are allowed' };
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, message: 'Image size must be 5MB or smaller' };
    }
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('Missing BLOB_READ_WRITE_TOKEN');
      return { success: false, message: 'Server configuration error: Missing storage token' };
    }

    const blob = await put(file.name, file, {
      access: 'public',
    });

    await setPlayerPhotoUrlById(numericPlayerId, blob.url);

    return { success: true, url: blob.url };
  } catch (error) {
    console.error('Failed to upload player photo:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown upload error' };
  }
}

// Announcements Actions

export async function getAnnouncements() {
  try {
    return await listAnnouncements();
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    return [];
  }
}

export async function addAnnouncement(data: {
  title?: string;
  content: string;
  date: Date;
}) {
  try {
    const announcement = await createAnnouncement({
      title: data.title ?? null,
      content: data.content,
      date: data.date,
    });

    if (!announcement) return { success: false, message: 'Failed to add announcement' };
    return { success: true, announcement };
  } catch (error) {
    console.error('Failed to add announcement:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteAnnouncement(id: number) {
  try {
    await deleteAnnouncementById(id);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete announcement:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}
