// Server-only DB access for per-match kit overrides.
//
// This file imports the tenant context (next/headers) and MUST NOT be imported
// from a client component. Client/localStorage helpers live in
// ./matchKitOverrides.ts (client-safe). Keeping the two separate prevents
// next/cache + next/headers from leaking into the browser bundle.

import { db } from '@/lib/db';
import { matchKitOverrides } from '@/lib/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getRequestLeagueId } from '@/lib/tenant/context';

function resolveLid(leagueId?: number): Promise<number> {
  return typeof leagueId === 'number' ? Promise.resolve(leagueId) : getRequestLeagueId();
}

// 從 DB 獲取某場比賽嘅所有 override
export async function getMatchKitOverrides(
  matchId: number,
  leagueId?: number
): Promise<Record<string, string>> {
  try {
    const lid = await resolveLid(leagueId);
    const overrides = await db
      .select()
      .from(matchKitOverrides)
      .where(and(eq(matchKitOverrides.matchId, matchId), eq(matchKitOverrides.leagueId, lid)));

    const result: Record<string, string> = {};
    for (const override of overrides) {
      const normalized = override.teamName.trim().toUpperCase();
      result[normalized] = override.kitColor;
    }
    return result;
  } catch (error) {
    console.error('Failed to get match kit overrides from DB:', error);
    return {};
  }
}

// 一次過攞多場比賽嘅所有 override（批量，避免 N+1 逐場查 DB）
export async function getManyMatchKitOverrides(
  matchIds: number[],
  leagueId?: number
): Promise<Record<number, Record<string, string>>> {
  const result: Record<number, Record<string, string>> = {};
  if (matchIds.length === 0) return result;
  try {
    const lid = await resolveLid(leagueId);
    const rows = await db
      .select()
      .from(matchKitOverrides)
      .where(
        and(eq(matchKitOverrides.leagueId, lid), inArray(matchKitOverrides.matchId, matchIds))
      );

    for (const r of rows) {
      const bucket = (result[r.matchId] ??= {});
      bucket[r.teamName.trim().toUpperCase()] = r.kitColor;
    }
  } catch (error) {
    console.error('Failed to batch load match kit overrides:', error);
  }
  return result;
}

// 獲取某場比賽某隊嘅 override 顏色
export async function getMatchKitOverrideColorValue(
  matchId: number,
  teamName: string,
  leagueId?: number
): Promise<string | null> {
  // 球衣色優先序：每場 override（DB）→ null（由呼叫端 fallback 去 team 主/客場色）。
  try {
    const lid = await resolveLid(leagueId);
    const normalized = teamName.trim().toUpperCase();
    const overrides = await db
      .select()
      .from(matchKitOverrides)
      .where(and(eq(matchKitOverrides.matchId, matchId), eq(matchKitOverrides.leagueId, lid)));

    for (const override of overrides) {
      if (override.teamName.trim().toUpperCase() === normalized) {
        return override.kitColor;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to get match kit override value:', error);
    return null;
  }
}

// 設置/更新 override
export async function setMatchKitOverride(
  matchId: number,
  teamName: string,
  kitColor: string,
  leagueId?: number
) {
  const lid = await resolveLid(leagueId);
  const normalized = teamName.trim().toUpperCase();
  const now = new Date();

  const existing = await db
    .select()
    .from(matchKitOverrides)
    .where(
      and(
        eq(matchKitOverrides.matchId, matchId),
        eq(matchKitOverrides.teamName, normalized),
        eq(matchKitOverrides.leagueId, lid)
      )
    );

  if (existing.length > 0) {
    await db
      .update(matchKitOverrides)
      .set({ kitColor, updatedAt: now })
      .where(eq(matchKitOverrides.id, existing[0].id));
  } else {
    await db.insert(matchKitOverrides).values({
      matchId,
      teamName: normalized,
      kitColor,
      leagueId: lid,
      createdAt: now,
      updatedAt: now,
    });
  }
}

// 刪除 override
export async function deleteMatchKitOverride(
  matchId: number,
  teamName: string,
  leagueId?: number
) {
  const lid = await resolveLid(leagueId);
  const normalized = teamName.trim().toUpperCase();
  await db
    .delete(matchKitOverrides)
    .where(
      and(
        eq(matchKitOverrides.matchId, matchId),
        eq(matchKitOverrides.teamName, normalized),
        eq(matchKitOverrides.leagueId, lid)
      )
    );
}
