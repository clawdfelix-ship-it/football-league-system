import { getManyMatchKitOverrides } from '@/lib/matchKitOverrides';
import { listMatches, listTeamSettings } from '@/lib/queries';
import FixturesClient, { type Match, type Team } from './FixturesClient';

export const dynamic = 'force-dynamic';

export default async function FixturesPage() {
  let teamRows: Awaited<ReturnType<typeof listTeamSettings>> = [];
  let matchRows: Awaited<ReturnType<typeof listMatches>> = [];
  try {
    [teamRows, matchRows] = await Promise.all([listTeamSettings(), listMatches()]);
  } catch {
    teamRows = [];
    matchRows = [];
  }

  const teams: Record<string, Team> = {};
  for (const t of teamRows) {
    teams[t.name] = {
      name: t.name,
      homeKitColor: t.homeKitColor ?? 'white',
      awayKitColor: t.awayKitColor ?? 'black',
    };
  }

  // Preload all kit overrides — single batched query (was a per-match N+1 loop)
  const allMatchIds = matchRows.map((m) => m.id);
  let allOverrides: Record<number, Record<string, string>> = {};
  try {
    allOverrides = await getManyMatchKitOverrides(allMatchIds);
  } catch {
    allOverrides = {};
  }

  // Serialize dates for the client component
  const matches: Match[] = matchRows.map((m) => ({
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

  return (
    <FixturesClient matches={matches} teams={teams} allOverrides={allOverrides} />
  );
}
