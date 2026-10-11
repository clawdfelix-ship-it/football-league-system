import { revalidateTag, unstable_cache } from 'next/cache';
import { getManyMatchKitOverrides } from './matchKitOverrides.server';
import { listMatches, listTeamSettings } from './queries';
import { getRequestLeagueId } from './tenant/context';

// 公開頁共用嘅全域快取標籤：只留俾「影響全部租戶」嘅平台級操作。
// 一般租戶寫入請用 revalidateFixturesForLeague()（精準踢自己 league）。
export const FIXTURES_CACHE_TAG = 'fixtures';
// Per-league tag for precise invalidation once multiple tenants exist.
export const fixturesLeagueTag = (leagueId: number) => `fixtures-league:${leagueId}`;

// 只失效單一租戶嘅 fixtures 快取（唔會廣播踢走其他 league）。
export async function revalidateFixturesForLeague(leagueId?: number) {
  const lid =
    typeof leagueId === 'number' && Number.isFinite(leagueId) && leagueId > 0
      ? leagueId
      : await getRequestLeagueId();
  revalidateTag(fixturesLeagueTag(lid), 'max');
}

export type FixturesTeam = {
  name: string;
  homeKitColor: string;
  awayKitColor: string;
};

export type FixturesMatch = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  date: string | null;
  venue: string | null;
  round: string | null;
  status: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type FixturesData = {
  teams: Record<string, FixturesTeam>;
  matches: FixturesMatch[];
  allOverrides: Record<number, Record<string, string>>;
};

// 整個賽程頁數據包快取（**按 league 分開快取**，避免跨租戶食到對方數據）。
// - 正常訪問 → 直接返該聯賽嘅快取（秒開，唔使等 Neon cold start）
// - 管理員改嘢 → 各 mutation 行 revalidateFixturesForLeague()（只踢自己 league）；
//   FIXTURES_CACHE_TAG 留俾影響全部租戶嘅平台級操作。
// - revalidate: 300 做安全網（即使漏咗 invalidate，最多 5 分鐘舊數據）
async function buildFixturesData(leagueId: number): Promise<FixturesData> {
  const teamRows = await listTeamSettings(leagueId);
  const matchRows = await listMatches(undefined, leagueId);

  const teams: Record<string, FixturesTeam> = {};
  for (const t of teamRows) {
    teams[t.name] = {
      name: t.name,
      homeKitColor: t.homeKitColor ?? 'white',
      awayKitColor: t.awayKitColor ?? 'black',
    };
  }

  const allOverrides = await getManyMatchKitOverrides(matchRows.map((m) => m.id), leagueId);

  const matches: FixturesMatch[] = matchRows.map((m) => ({
    id: m.id,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    date: m.date ? new Date(m.date).toISOString() : null,
    venue: m.venue,
    round: m.round,
    status: m.status,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
  }));

  return { teams, matches, allOverrides };
}

export async function getFixturesData(leagueId?: number) {
  // Explicit positive id wins; 0 / NaN / negative fall through to the
  // per-request tenant (unknown host resolves to 0 -> its own empty slot).
  const lid =
    typeof leagueId === 'number' && Number.isFinite(leagueId) && leagueId > 0
      ? leagueId
      : await getRequestLeagueId();
  const cached = unstable_cache(
    async () => buildFixturesData(lid),
    ['fixtures-data', String(lid)],
    {
      revalidate: 300,
      tags: [FIXTURES_CACHE_TAG, fixturesLeagueTag(lid)],
    },
  );
  return cached();
}
