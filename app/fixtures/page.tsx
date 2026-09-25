import FixturesClient, { type Match, type Team } from './FixturesClient';
import { getFixturesData } from '@/lib/fixtures-data';

// 改用快取（ISR）：正常訪問直接返快取秒開，唔使等 Neon cold start。
// 管理員改賽果/球衣色時 revalidateTag，下次訪問先重建。
export default async function FixturesPage() {
  let data;
  try {
    data = await getFixturesData();
  } catch {
    data = { teams: {}, matches: [], allOverrides: {} };
  }

  return (
    <FixturesClient
      matches={data.matches as Match[]}
      teams={data.teams as Record<string, Team>}
      allOverrides={data.allOverrides}
    />
  );
}
