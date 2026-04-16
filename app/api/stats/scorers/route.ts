import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { matchPlayerGoals, matches, players } from '@/lib/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET() {
  if (!db) {
    return NextResponse.json({ message: 'Database is not configured' }, { status: 500 });
  }

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

  return NextResponse.json({ scorers: rows });
}
