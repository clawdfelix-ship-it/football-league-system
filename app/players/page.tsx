import type { PublicPlayer } from '@/lib/public-types';
import PlayersClient from '@/app/players/PlayersClient';
import { listPublicPlayers } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  let players: PublicPlayer[] = [];
  try {
    players = await listPublicPlayers();
  } catch {
    players = [];
  }
  return <PlayersClient initialPlayers={players} />;
}
