import { db } from '@/lib/db';
import { matchKitOverrides } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// 從 DB 獲取某場比賽嘅所有 override
export async function getMatchKitOverrides(matchId: number): Promise<Record<string, string>> {
  const overrides = await db
    .select()
    .from(matchKitOverrides)
    .where(eq(matchKitOverrides.matchId, matchId));

  const result: Record<string, string> = {};
  for (const override of overrides) {
    const normalized = override.teamName.trim().toUpperCase();
    result[normalized] = override.kitColor;
  }
  return result;
}

// 獲取某場比賽某隊嘅 override 顏色 (Server-side)
export async function getMatchKitOverrideColorValue(matchId: number, teamName: string): Promise<string | null> {
  const normalized = teamName.trim().toUpperCase();
  const overrides = await db
    .select()
    .from(matchKitOverrides)
    .where(eq(matchKitOverrides.matchId, matchId));

  for (const override of overrides) {
    if (override.teamName.trim().toUpperCase() === normalized) {
      return override.kitColor;
    }
  }
  return null;
}

// 設置/更新 override
export async function setMatchKitOverride(matchId: number, teamName: string, kitColor: string) {
  const normalized = teamName.trim().toUpperCase();
  const now = new Date();

  // Check if exists
  const existing = await db
    .select()
    .from(matchKitOverrides)
    .where(and(eq(matchKitOverrides.matchId, matchId), eq(matchKitOverrides.teamName, normalized)));

  if (existing.length > 0) {
    // Update
    await db
      .update(matchKitOverrides)
      .set({ kitColor, updatedAt: now })
      .where(eq(matchKitOverrides.id, existing[0].id));
  } else {
    // Insert
    await db.insert(matchKitOverrides).values({
      matchId,
      teamName: normalized,
      kitColor,
      createdAt: now,
      updatedAt: now,
    });
  }
}

// 刪除 override
export async function deleteMatchKitOverride(matchId: number, teamName: string) {
  const normalized = teamName.trim().toUpperCase();
  await db
    .delete(matchKitOverrides)
    .where(and(eq(matchKitOverrides.matchId, matchId), eq(matchKitOverrides.teamName, normalized)));
}

// Client-side helper (從 API 獲取)
export function getMatchKitOverrideColorValueClient(
  overridesCache: Record<number, Record<string, string>>,
  matchId: number,
  teamName: string
): string | null {
  const normalized = teamName.trim().toUpperCase();
  const byTeam = overridesCache[matchId];
  if (!byTeam) return null;
  return byTeam[normalized] ?? null;
}
