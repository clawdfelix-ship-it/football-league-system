import { db } from '@/lib/db';
import { announcements, matchPlayerGoals, matches, players, teams as teamsTable } from '@/lib/schema';
import { asc, desc, eq, inArray, or, sql } from 'drizzle-orm';

// Resolve a team's display name to its teams.id (case/whitespace insensitive).
// Returns null when the name does not match a known team — callers keep the
// legacy string column intact and leave the *_id column NULL (never throws),
// which matches the FK's ON DELETE SET NULL semantics.
export async function resolveTeamId(teamName: string | null | undefined): Promise<number | null> {
  const normalized = (teamName ?? '').trim();
  if (!normalized) return null;
  const [row] = await db
    .select({ id: teamsTable.id })
    .from(teamsTable)
    .where(sql`LOWER(TRIM(${teamsTable.name})) = LOWER(TRIM(${normalized}))`)
    .limit(1);
  return row?.id ?? null;
}


export async function listMatches(status?: 'scheduled' | 'finished' | 'tbc') {
  if (status === 'scheduled') {
    return await db
      .select()
      .from(matches)
      .where(or(eq(matches.status, 'scheduled'), eq(matches.status, 'tbc')))
      .orderBy(asc(matches.date));
  }

  if (status) {
    return await db.select().from(matches).where(eq(matches.status, status)).orderBy(desc(matches.date));
  }

  return await db.select().from(matches).orderBy(desc(matches.date));
}

export async function createMatch(input: {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number | null;
  awayScore?: number | null;
  date?: Date | null;
  venue?: string | null;
  status?: 'scheduled' | 'finished' | 'tbc' | null;
  round?: string | null;
}) {
  const now = new Date();
  const [homeTeamId, awayTeamId] = await Promise.all([
    resolveTeamId(input.homeTeam),
    resolveTeamId(input.awayTeam),
  ]);
  const [row] = await db
    .insert(matches)
    .values({
      homeTeam: input.homeTeam,
      awayTeam: input.awayTeam,
      homeTeamId,
      awayTeamId,
      homeScore: input.homeScore ?? null,
      awayScore: input.awayScore ?? null,
      date: input.date ?? null,
      venue: input.venue ?? null,
      status: input.status ?? 'scheduled',
      round: input.round ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return row ?? null;
}

export async function updateMatchById(
  id: number,
  input: {
    homeTeam?: string;
    awayTeam?: string;
    homeScore?: number | null;
    awayScore?: number | null;
    date?: Date | null;
    venue?: string | null;
    status?: 'scheduled' | 'finished' | 'tbc' | null;
    round?: string | null;
  }
) {
  const now = new Date();
  // Keep FK columns in sync when a team name is changed.
  const resolvedHome =
    input.homeTeam !== undefined ? { homeTeamId: await resolveTeamId(input.homeTeam) } : {};
  const resolvedAway =
    input.awayTeam !== undefined ? { awayTeamId: await resolveTeamId(input.awayTeam) } : {};
  const [row] = await db
    .update(matches)
    .set({
      ...input,
      ...resolvedHome,
      ...resolvedAway,
      updatedAt: now,
    })
    .where(eq(matches.id, id))
    .returning();

  return row ?? null;
}

export async function deleteMatchById(id: number) {
  const [row] = await db.delete(matches).where(eq(matches.id, id)).returning();
  return row ?? null;
}

export async function deleteAllMatches() {
  return await db.delete(matches).returning();
}

export async function getMatchById(id: number) {
  const [row] = await db.select().from(matches).where(eq(matches.id, id));
  return row ?? null;
}

export async function listTeamSettings() {
  return await db
    .select({
      id: teamsTable.id,
      name: teamsTable.name,
      homeKitColor: teamsTable.homeKitColor,
      awayKitColor: teamsTable.awayKitColor,
      createdAt: teamsTable.createdAt,
      updatedAt: teamsTable.updatedAt,
    })
    .from(teamsTable)
    .orderBy(asc(teamsTable.name));
}

export async function upsertTeamSettings(input: {
  name: string;
  homeKitColor: string;
  awayKitColor: string;
}) {
  const now = new Date();
  const [row] = await db
    .insert(teamsTable)
    .values({
      name: input.name,
      homeKitColor: input.homeKitColor,
      awayKitColor: input.awayKitColor,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: teamsTable.name,
      set: {
        homeKitColor: input.homeKitColor,
        awayKitColor: input.awayKitColor,
        updatedAt: now,
      },
    })
    .returning({
      id: teamsTable.id,
      name: teamsTable.name,
      homeKitColor: teamsTable.homeKitColor,
      awayKitColor: teamsTable.awayKitColor,
      createdAt: teamsTable.createdAt,
      updatedAt: teamsTable.updatedAt,
    });

  return row ?? null;
}

export async function listAnnouncements() {
  return await db.select().from(announcements).orderBy(asc(announcements.date));
}

export async function listPlayers() {
  return await db
    .select()
    .from(players)
    .orderBy(asc(players.team), asc(players.jerseyNumber), asc(players.name));
}

export async function listPlayersByTeam(teamName: string) {
  return await db.select().from(players).where(eq(players.team, teamName)).orderBy(asc(players.jerseyNumber));
}

export async function createAnnouncement(input: { title?: string | null; content: string; date: Date }) {
  const now = new Date();
  const [row] = await db
    .insert(announcements)
    .values({
      title: input.title ?? null,
      content: input.content,
      date: input.date,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return row ?? null;
}

export async function deleteAnnouncementById(id: number) {
  const [row] = await db.delete(announcements).where(eq(announcements.id, id)).returning();
  return row ?? null;
}

export type PublicPlayerRow = {
  id: number;
  name: string;
  jerseyNumber: number | null;
  position: string | null;
  team: string | null;
  photoUrl: string | null;
  status: string | null;
};

export async function listPublicPlayers(): Promise<PublicPlayerRow[]> {
  return await db
    .select({
      id: players.id,
      name: players.name,
      jerseyNumber: players.jerseyNumber,
      position: players.position,
      team: players.team,
      photoUrl: players.photoUrl,
      status: players.status,
    })
    .from(players)
    .orderBy(asc(players.team), asc(players.jerseyNumber), asc(players.name));
}

export async function createPlayer(input: {
  name: string;
  jerseyNumber: number;
  position: string;
  team: string;
  age: number;
  nationality?: string;
  height?: number;
  weight?: number;
  joinedDate?: Date;
  status?: string;
  phoneNumber?: string;
  email?: string;
  emergencyContact?: string;
  notes?: string;
  photoUrl?: string;
  identityPrefix?: string;
}) {
  const now = new Date();
  const teamId = await resolveTeamId(input.team);
  const [row] = await db
    .insert(players)
    .values({
      name: input.name,
      jerseyNumber: input.jerseyNumber,
      position: input.position,
      team: input.team,
      teamId,
      age: input.age,
      nationality: input.nationality ?? null,
      height: input.height ?? null,
      weight: input.weight ?? null,
      joinedDate: input.joinedDate ?? now,
      status: input.status ?? 'active',
      phoneNumber: input.phoneNumber ?? null,
      email: input.email ?? null,
      emergencyContact: input.emergencyContact ?? null,
      notes: input.notes ?? null,
      photoUrl: input.photoUrl ?? null,
      identityPrefix: input.identityPrefix ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return row ?? null;
}

export async function getPlayerTeamById(id: number): Promise<string | null> {
  const [row] = await db.select({ team: players.team }).from(players).where(eq(players.id, id));
  return row?.team ?? null;
}

export async function deletePlayerById(id: number) {
  const [row] = await db.delete(players).where(eq(players.id, id)).returning();
  return row ?? null;
}

export async function updatePlayerById(
  id: number,
  input: {
    name?: string;
    jerseyNumber?: number;
    position?: string;
    team?: string;
    phoneNumber?: string | null;
    email?: string | null;
    identityPrefix?: string | null;
  }
) {
  const now = new Date();
  // Keep FK column in sync when the team name is changed.
  const resolvedTeam = input.team !== undefined ? { teamId: await resolveTeamId(input.team) } : {};
  const [row] = await db
    .update(players)
    .set({
      ...input,
      ...resolvedTeam,
      updatedAt: now,
    })
    .where(eq(players.id, id))
    .returning();
  return row ?? null;
}

export async function setPlayerPhotoUrlById(id: number, url: string) {
  const now = new Date();
  const [row] = await db
    .update(players)
    .set({
      photoUrl: url,
      updatedAt: now,
    })
    .where(eq(players.id, id))
    .returning();
  return row ?? null;
}

export async function listScorers() {
  const rows = await db
    .select({
      playerId: players.id,
      playerName: players.name,
      team: players.team,
      goals: sql<number>`sum(${matchPlayerGoals.goals})`,
      lastMatchDate: sql<string | null>`max(${matches.date})`,
    })
    .from(matchPlayerGoals)
    .innerJoin(players, eq(matchPlayerGoals.playerId, players.id))
    .innerJoin(matches, eq(matchPlayerGoals.matchId, matches.id))
    .groupBy(players.id, players.name, players.team)
    .orderBy(desc(sql`sum(${matchPlayerGoals.goals})`), players.name);

  return rows;
}

export type MatchGoalEntry = {
  playerId: number;
  playerName: string;
  team: string | null;
  goals: number;
};

export async function listMatchGoalEntries(matchId: number): Promise<MatchGoalEntry[]> {
  const rows = await db
    .select({
      playerId: matchPlayerGoals.playerId,
      playerName: players.name,
      team: players.team,
      goals: matchPlayerGoals.goals,
    })
    .from(matchPlayerGoals)
    .innerJoin(players, eq(matchPlayerGoals.playerId, players.id))
    .where(eq(matchPlayerGoals.matchId, matchId))
    .orderBy(asc(players.team), asc(players.name));
  return rows;
}

export async function replaceMatchGoalEntries(
  matchId: number,
  entries: Array<{ playerId: number; goals: number }>
) {
  await db.delete(matchPlayerGoals).where(eq(matchPlayerGoals.matchId, matchId));
  const filtered = entries.filter((e) => Number.isFinite(e.goals) && e.goals > 0);
  if (filtered.length === 0) return [];
  return await db
    .insert(matchPlayerGoals)
    .values(filtered.map((e) => ({ matchId, playerId: e.playerId, goals: e.goals })))
    .returning();
}

export async function getPlayersByIds(ids: number[]) {
  const unique = Array.from(new Set(ids)).filter((n) => Number.isFinite(n) && n > 0);
  if (unique.length === 0) return [];
  return await db
    .select({ id: players.id, team: players.team })
    .from(players)
    .where(inArray(players.id, unique));
}
