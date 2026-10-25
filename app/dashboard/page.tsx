import HomeLayout from '@/components/HomeLayout';
import { getTeamsForCurrentLeague } from '@/lib/teams/load';
import type { Player } from '@/lib/schema';
import { listPlayers } from '@/lib/queries';
import DashboardView from './DashboardView';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '數據總覽 · Dashboard | Hong Kong Bank League 2026',
};

export default async function DashboardPage() {
  // Distinguish a real fetch failure from a legitimately empty roster, so the
  // UI never silently shows "0 players" when the database is unreachable.
  let players: Player[] = [];
  let loadError = false;
  try {
    players = (await listPlayers()) as Player[];
  } catch {
    loadError = true;
  }

  const totalPlayers = players.length;
  const activePlayers = players.filter((p) => p.status === 'active').length;
  const injuredPlayers = players.filter((p) => p.status === 'injured').length;
  const suspendedPlayers = players.filter((p) => p.status === 'suspended').length;
  const inactivePlayers = players.filter((p) => p.status === 'inactive').length;

  const teams = await getTeamsForCurrentLeague();
  const teamStats = teams.filter((team) => team.name !== 'DEMO')
    .map((team) => {
      const teamPlayers = players.filter((p) => p.team === team.name);
      return {
        team: team.name,
        count: teamPlayers.length,
        active: teamPlayers.filter((p) => p.status === 'active').length,
        avgAge:
          teamPlayers.length > 0
            ? Math.round(
                teamPlayers.reduce((sum, p) => sum + (p.age || 0), 0) /
                  teamPlayers.length,
              )
            : 0,
      };
    })
    .filter((t) => t.count > 0);

  const positionStats = players.reduce((acc: Record<string, number>, player) => {
    const pos = player.position || '未知';
    acc[pos] = (acc[pos] || 0) + 1;
    return acc;
  }, {});

  const ageGroups = {
    '16-20': players.filter((p) => { const a = p.age ?? 0; return a >= 16 && a <= 20; }).length,
    '21-25': players.filter((p) => { const a = p.age ?? 0; return a >= 21 && a <= 25; }).length,
    '26-30': players.filter((p) => { const a = p.age ?? 0; return a >= 26 && a <= 30; }).length,
    '31-35': players.filter((p) => { const a = p.age ?? 0; return a >= 31 && a <= 35; }).length,
    '36+': players.filter((p) => { const a = p.age ?? 0; return a >= 36; }).length,
  };

  return (
    <HomeLayout>
      <DashboardView
        loadError={loadError}
        stats={{ totalPlayers, activePlayers, injuredPlayers, suspendedPlayers, inactivePlayers }}
        teamStats={teamStats}
        positionStats={positionStats}
        ageGroups={ageGroups}
      />
    </HomeLayout>
  );
}
