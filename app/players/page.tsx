import type { PublicPlayer } from '@/lib/public-types';
import PlayersClient from '@/app/players/PlayersClient';
import { listPublicPlayers } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  const players: PublicPlayer[] = await listPublicPlayers();
  return <PlayersClient initialPlayers={players} />;
}
