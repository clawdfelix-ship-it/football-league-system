import TeamsClient from '@/app/teams/TeamsClient';
import { getTeamsForCurrentLeague } from '@/lib/teams/load';
import { listPublicPlayers } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function TeamsPage() {
  let players: Awaited<ReturnType<typeof listPublicPlayers>> = [];
  try {
    players = await listPublicPlayers();
  } catch {
    players = [];
  }
  const teams = await getTeamsForCurrentLeague();
  const teamList = teams.filter((t) => t.name !== 'DEMO').map((team) => {
    const teamPlayers = players.filter((p) => p.team === team.name);
    return {
      ...team,
      playerCount: teamPlayers.length,
      players: teamPlayers,
    };
  });

  return <TeamsClient initialTeams={teamList} />;
}
