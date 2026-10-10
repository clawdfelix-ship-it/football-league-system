import { db } from '@/lib/db';
import { announcements, matchPlayerGoals, matches, players, teams as teamsTable } from '@/lib/schema';
import { asc, desc, eq, inArray, or, sql, and } from 'drizzle-orm';
import { getRequestLeagueId } from './tenant/context';

// Resolve the league a query should run against. Explicit leagueId (e.g. from
// a tested function or a provisioning script) wins; otherwise the per-request
// tenant context decides, which itself safely defaults to the founding league
// outside a request scope. Today every row is league #1, so behaviour is
// unchanged; this is the seam that isolates data once more leagues exist.
async function resolveLeagueId(leagueId?: number): Promise<number> {
  return typeof leagueId === 'number' && Number.isFinite(leagueId) && leagueId > 0
    ? leagueId
    : await getRequestLeagueId();
}

// Resolve a team's display name to its teams.id (case/whitespace insensitive).
// Returns null when the name does not match a known team — callers keep the
// legacy string column intact and leave the *_id column NULL (never throws),
// which matches the FK's ON DELETE SET NULL semantics.
export async function resolveTeamId(
  teamName: string | null | undefined,
  leagueId?: number
): Promise<number | null> {
  const normalized = (teamName ?? '').trim();
  if (!normalized) return null;
  const lid = await resolveLeagueId(leagueId);
  const [row] = await db
    .select({ id: teamsTable.id })
    .from(teamsTable)
    .where(
      and(
        eq(teamsTable.leagueId, lid),
        sql`LOWER(TRIM(${teamsTable.name})) = LOWER(TRIM(${normalized}))`
      )
    )
    .limit(1);
  return row?.id ?? null;
}


export async function listMatches(status?: 'scheduled' | 'finished' | 'tbc', leagueId?: number) {
  const lid = await resolveLeagueId(leagueId);
  if (status === 'scheduled') {
    return await db
      .select()
      .from(matches)
      .where(and(eq(matches.leagueId, lid), or(eq(matches.status, 'scheduled'), eq(matches.status, 'tbc'))))
      .orderBy(asc(matches.date));
  }

  if (status) {
    return await db.select().from(matches)
      .where(and(eq(matches.leagueId, lid), eq(matches.status, status)))
      .orderBy(desc(matches.date));
  }

  return await db.select().from(matches)
    .where(eq(matches.leagueId, lid))
    .orderBy(desc(matches.date));
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
  leagueId?: number;
}) {
  const lid = await resolveLeagueId(input.leagueId);
  const now = new Date();
  const [homeTeamId, awayTeamId] = await Promise.all([
    resolveTeamId(input.homeTeam, lid),
    resolveTeamId(input.awayTeam, lid),
  ]);
  const [row] = await db
    .insert(matches)
    .values({
      leagueId: lid,
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
  },
  leagueId?: number
) {
  const lid = await resolveLeagueId(leagueId);
  const now = new Date();
  // Keep FK columns in sync when a team name is changed.
  const resolvedHome =
    input.homeTeam !== undefined ? { homeTeamId: await resolveTeamId(input.homeTeam, lid) } : {};
  const resolvedAway =
    input.awayTeam !== undefined ? { awayTeamId: await resolveTeamId(input.awayTeam, lid) } : {};
  const [row] = await db
    .update(matches)
    .set({
      ...input,
      ...resolvedHome,
      ...resolvedAway,
      updatedAt: now,
    })
    .where(and(eq(matches.id, id), eq(matches.leagueId, lid)))
    .returning();

  return row ?? null;
}

export async function deleteMatchById(id: number, leagueId?: number) {
  const lid = await resolveLeagueId(leagueId);
  const [row] = await db.delete(matches)
    .where(and(eq(matches.id, id), eq(matches.leagueId, lid)))
    .returning();
  return row ?? null;
}

export async function deleteAllMatches(leagueId?: number) {
  const lid = await resolveLeagueId(leagueId);
  return await db.delete(matches).where(eq(matches.leagueId, lid)).returning();
}

export async function getMatchById(id: number, leagueId?: number) {
  const lid = await resolveLeagueId(leagueId);
  const [row] = await db.select().from(matches)
    .where(and(eq(matches.id, id), eq(matches.leagueId, lid)));
  return row ?? null;
}

export async function listTeamSettings(leagueId?: number) {
  const lid = await resolveLeagueId(leagueId);
  return await db
    .select({
      id: teamsTable.id,
      name: teamsTable.name,
      homeKitColor: teamsTable.homeKitColor,
      awayKitColor: teamsTable.awayKitColor,
      shortName: teamsTable.shortName,
      nameZh: teamsTable.nameZh,
      colorGradient: teamsTable.colorGradient,
      leagueId: teamsTable.leagueId,
      createdAt: teamsTable.createdAt,
      updatedAt: teamsTable.updatedAt,
    })
    .from(teamsTable)
    .where(eq(teamsTable.leagueId, lid))
    .orderBy(asc(teamsTable.name));
}

export async function upsertTeamSettings(
  input: {
    name: string;
    homeKitColor: string;
    awayKitColor: string;
  },
  leagueId?: number
) {
  const lid = await resolveLeagueId(leagueId);
  const now = new Date();
  const [row] = await db
    .insert(teamsTable)
    .values({
      name: input.name,
      homeKitColor: input.homeKitColor,
      awayKitColor: input.awayKitColor,
      leagueId: lid,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [teamsTable.leagueId, teamsTable.name],
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
      leagueId: teamsTable.leagueId,
      createdAt: teamsTable.createdAt,
      updatedAt: teamsTable.updatedAt,
    });

  return row ?? null;
}

export async function listAnnouncements(leagueId?: number) {
  const lid = await resolveLeagueId(leagueId);
  return await db.select().from(announcements)
    .where(eq(announcements.leagueId, lid))
    .orderBy(asc(announcements.date));
}

export async function listPlayers(leagueId?: number) {
  const lid = await resolveLeagueId(leagueId);
  return await db
    .select()
    .from(players)
    .where(eq(players.leagueId, lid))
    .orderBy(asc(players.team), asc(players.jerseyNumber), asc(players.name));
}

export async function listPlayersByTeam(teamName: string, leagueId?: number) {
  const lid = await resolveLeagueId(leagueId);
  return await db.select().from(players)
    .where(and(eq(players.leagueId, lid), eq(players.team, teamName)))
    .orderBy(asc(players.jerseyNumber));
}

export async function createAnnouncement(
  input: { title?: string | null; content: string; date: Date },
  leagueId?: number
) {
  const lid = await resolveLeagueId(leagueId);
  const now = new Date();
  const [row] = await db
    .insert(announcements)
    .values({
      leagueId: lid,
      title: input.title ?? null,
      content: input.content,
      date: input.date,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return row ?? null;
}

export async function deleteAnnouncementById(id: number, leagueId?: number) {
  const lid = await resolveLeagueId(leagueId);
  const [row] = await db.delete(announcements)
    .where(and(eq(announcements.id, id), eq(announcements.leagueId, lid)))
    .returning();
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

export async function listPublicPlayers(leagueId?: number): Promise<PublicPlayerRow[]> {
  const lid = await resolveLeagueId(leagueId);
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
    .where(eq(players.leagueId, lid))
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
  leagueId?: number;
}) {
  const lid = await resolveLeagueId(input.leagueId);
  const now = new Date();
  const teamId = await resolveTeamId(input.team, lid);
  const [row] = await db
    .insert(players)
    .values({
      name: input.name,
      jerseyNumber: input.jerseyNumber,
      position: input.position,
      team: input.team,
      teamId,
      leagueId: lid,
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

export async function getPlayerTeamById(id: number, leagueId?: number): Promise<string | null> {
  const lid = await resolveLeagueId(leagueId);
  const [row] = await db.select({ team: players.team }).from(players)
    .where(and(eq(players.id, id), eq(players.leagueId, lid)));
  return row?.team ?? null;
}

export async function deletePlayerById(id: number, leagueId?: number) {
  const lid = await resolveLeagueId(leagueId);
  const [row] = await db.delete(players)
    .where(and(eq(players.id, id), eq(players.leagueId, lid)))
    .returning();
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
  },
  leagueId?: number
) {
  const lid = await resolveLeagueId(leagueId);
  const now = new Date();
  // Keep FK column in sync when the team name is changed.
  const resolvedTeam = input.team !== undefined ? { teamId: await resolveTeamId(input.team, lid) } : {};
  const [row] = await db
    .update(players)
    .set({
      ...input,
      ...resolvedTeam,
      updatedAt: now,
    })
    .where(and(eq(players.id, id), eq(players.leagueId, lid)))
    .returning();
  return row ?? null;
}

export async function setPlayerPhotoUrlById(id: number, url: string, leagueId?: number) {
  const lid = await resolveLeagueId(leagueId);
  const now = new Date();
  const [row] = await db
    .update(players)
    .set({
      photoUrl: url,
      updatedAt: now,
    })
    .where(and(eq(players.id, id), eq(players.leagueId, lid)))
    .returning();
  return row ?? null;
}

export async function listScorers(leagueId?: number) {
  const lid = await resolveLeagueId(leagueId);
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
    .where(eq(matchPlayerGoals.leagueId, lid))
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

export async function listMatchGoalEntries(matchId: number, leagueId?: number): Promise<MatchGoalEntry[]> {
  const lid = await resolveLeagueId(leagueId);
  const rows = await db
    .select({
      playerId: matchPlayerGoals.playerId,
      playerName: players.name,
      team: players.team,
      goals: matchPlayerGoals.goals,
    })
    .from(matchPlayerGoals)
    .innerJoin(players, eq(matchPlayerGoals.playerId, players.id))
    .where(and(eq(matchPlayerGoals.matchId, matchId), eq(matchPlayerGoals.leagueId, lid)))
    .orderBy(asc(players.team), asc(players.name));
  return rows;
}

export async function replaceMatchGoalEntries(
  matchId: number,
  entries: Array<{ playerId: number; goals: number }>,
  leagueId?: number
) {
  const lid = await resolveLeagueId(leagueId);
  await db.delete(matchPlayerGoals)
    .where(and(eq(matchPlayerGoals.matchId, matchId), eq(matchPlayerGoals.leagueId, lid)));
  const filtered = entries.filter((e) => Number.isFinite(e.goals) && e.goals > 0);
  if (filtered.length === 0) return [];
  return await db
    .insert(matchPlayerGoals)
    .values(filtered.map((e) => ({ matchId, playerId: e.playerId, goals: e.goals, leagueId: lid })))
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
