// 註：舊版曾用「硬編碼球衣色」（2026-05-19 單一場次）並凌駕所有設定，
// 導致 DB 嘅主/客場球衣色同每場 override 全部被蓋過（例如 UBS 主場被鎖白）。
// 已移除硬編碼——球衣色一律以 DB team_settings（主/客場）為準，
// 每場 match_kit_overrides 可再覆蓋。
//
// 本檔只放 **client-safe**（localStorage / 純函數）helper，會被 'use client'
// 元件直接 import，所以呢度唔可以 import 任何 next/cache、next/headers、db 或
// tenant context（否則會把 server-only 嘢打入瀏覽器 bundle，build 即爆）。
// 伺服器端 DB 版本見 ./matchKitOverrides.server.ts。

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

// Client-side helper（cache → null，由呼叫端 fallback 去 team 主/客場色）
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
