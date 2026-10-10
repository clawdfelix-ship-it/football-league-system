import { unstable_cache } from 'next/cache';
import { getManyMatchKitOverrides } from './matchKitOverrides.server';
import { listMatches, listTeamSettings } from './queries';
import { getRequestLeagueId } from './tenant/context';

// 公開頁共用嘅快取標籤：任何賽果/球衣色改動都 revalidateTag 佢
export const FIXTURES_CACHE_TAG = 'fixtures';
// Per-league tag for precise invalidation once multiple tenants exist.
export const fixturesLeagueTag = (leagueId: number) => `fixtures-league:${leagueId}`;

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
// - 管理員改嘢 → 各 mutation 行 revalidateTag(FIXTURES_CACHE_TAG, 'max')，下次先重建
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
  // Explicit id wins; otherwise derive from the per-request tenant (defaults
  // safely to the founding league outside a request / on vercel.app).
  const lid = typeof leagueId === 'number' ? leagueId : await getRequestLeagueId();
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
