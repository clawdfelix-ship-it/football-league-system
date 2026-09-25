import { unstable_cache } from 'next/cache';
import { getManyMatchKitOverrides } from './matchKitOverrides';
import { listMatches, listTeamSettings } from './queries';

// 公開頁共用嘅快取標籤：任何賽果/球衣色改動都 revalidateTag 佢
export const FIXTURES_CACHE_TAG = 'fixtures';

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

// 整個賽程頁數據包快取。force-dynamic 移除後：
// - 正常訪問 → 直接返快取（秒開，唔使等 Neon cold start）
// - 管理員改嘢 → 各 mutation 行 revalidateTag(FIXTURES_CACHE_TAG, 'max')，下次先重建
// - revalidate: 300 做安全網（即使漏咗 invalidate，最多 5 分鐘舊數據）
async function buildFixturesData(): Promise<FixturesData> {
  const teamRows = await listTeamSettings();
  const matchRows = await listMatches();

  const teams: Record<string, FixturesTeam> = {};
  for (const t of teamRows) {
    teams[t.name] = {
      name: t.name,
      homeKitColor: t.homeKitColor ?? 'white',
      awayKitColor: t.awayKitColor ?? 'black',
    };
  }

  const allOverrides = await getManyMatchKitOverrides(matchRows.map((m) => m.id));

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

export const getFixturesData = unstable_cache(
  buildFixturesData,
  ['fixtures-data'],
  { revalidate: 300, tags: [FIXTURES_CACHE_TAG] },
);
