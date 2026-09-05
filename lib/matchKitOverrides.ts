// 註：舊版曾用「硬編碼球衣色」（2026-05-19 單一場次）並凌駕所有設定，
// 導致 DB 嘅主/客場球衣色同每場 override 全部被蓋過（例如 UBS 主場被鎖白）。
// 已移除硬編碼——球衣色一律以 DB team_settings（主/客場）為準，
// 每場 match_kit_overrides 可再覆蓋。

// 從 localStorage 獲取某場比賽嘅所有 override (client-side only)
export function getMatchKitOverridesLocal(matchId: number): Record<string, string> {
  // Server side 就 return empty object，唔好掂 localStorage
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(`kit_overrides_${matchId}`);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// 儲存某場比賽嘅 override 到 localStorage (client-side only)
export function setMatchKitOverrideLocal(matchId: number, teamName: string, color: string | null): void {
  // Server side 就唔做任何嘢
  if (typeof window === 'undefined') return;
  
  try {
    const normalized = teamName.trim().toUpperCase();
    const current = getMatchKitOverridesLocal(matchId);
    
    if (color) {
      current[normalized] = color;
    } else {
      delete current[normalized];
    }
    
    localStorage.setItem(`kit_overrides_${matchId}`, JSON.stringify(current));
  } catch (error) {
    console.error('Failed to save kit override to localStorage:', error);
  }
}

// 獲取所有比賽嘅 overrides (用於預加載)
export function getAllMatchKitOverridesLocal(matchIds: number[]): Record<number, Record<string, string>> {
  const result: Record<number, Record<string, string>> = {};
  for (const id of matchIds) {
    result[id] = getMatchKitOverridesLocal(id);
  }
  return result;
}

// 從 DB 獲取某場比賽嘅所有 override (如果有 DB 連接)
export async function getMatchKitOverrides(matchId: number): Promise<Record<string, string>> {
  try {
    const { db } = await import('@/lib/db');
    const { matchKitOverrides } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');
    
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
  } catch (error) {
    console.error('Failed to get match kit overrides from DB:', error);
    return {};
  }
}

// 獲取某場比賽某隊嘅 override 顏色 (Server-side)
export async function getMatchKitOverrideColorValue(matchId: number, teamName: string): Promise<string | null> {
  // 球衣色優先序：每場 override（DB）→ null（由呼叫端 fallback 去 team 主/客場色）。
  // 硬編碼已廢除，否則會蓋過管理員設定。
  try {
    const { db } = await import('@/lib/db');
    const { matchKitOverrides } = await import('@/lib/schema');
    const { eq } = await import('drizzle-orm');
    
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
  } catch (error) {
    console.error('Failed to get match kit override value:', error);
    return null;
  }
}

// 設置/更新 override
export async function setMatchKitOverride(matchId: number, teamName: string, kitColor: string) {
  try {
    const { db } = await import('@/lib/db');
    const { matchKitOverrides } = await import('@/lib/schema');
    const { eq, and } = await import('drizzle-orm');
    
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
  } catch (error) {
    console.error('Failed to upsert match kit override:', error);
    throw error;
  }
}

// 刪除 override
export async function deleteMatchKitOverride(matchId: number, teamName: string) {
  try {
    const { db } = await import('@/lib/db');
    const { matchKitOverrides } = await import('@/lib/schema');
    const { eq, and } = await import('drizzle-orm');
    
    const normalized = teamName.trim().toUpperCase();
    await db
      .delete(matchKitOverrides)
      .where(and(eq(matchKitOverrides.matchId, matchId), eq(matchKitOverrides.teamName, normalized)));
  } catch (error) {
    console.error('Failed to delete match kit override:', error);
    throw error;
  }
}

// Client-side helper (優先用硬編碼，然後先 API 再 localStorage)
export function getMatchKitOverrideColorValueClient(
  overridesCache: Record<number, Record<string, string>>,
  matchId: number,
  teamName: string
): string | null {
  // 球衣色優先序：每場 override（cache）→ null（由呼叫端 fallback 去 team 主/客場色）。
  // 硬編碼已廢除，否則會蓋過管理員設定。
  const normalized = teamName.trim().toUpperCase();
  const byTeam = overridesCache[matchId];
  if (!byTeam) return null;
  return byTeam[normalized] ?? null;
}
