import type { PublicPlayer } from '@/lib/public-types';
import PlayersClient from '@/app/players/PlayersClient';
import { listPublicPlayers } from '@/lib/queries';
import { getTeamsForCurrentLeague } from '@/lib/teams/load';

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  let players: PublicPlayer[] = [];
  try {
    players = await listPublicPlayers();
  } catch {
    players = [];
  }
  const teams = await getTeamsForCurrentLeague();
  return <PlayersClient initialPlayers={players} teams={teams} />;
}
