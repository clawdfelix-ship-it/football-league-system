import ScorersClient from '@/app/scorers/ScorersClient';
import { listScorers } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function ScorersPage() {
  let rows: Awaited<ReturnType<typeof listScorers>> = [];
  try {
    rows = await listScorers();
  } catch {
    rows = [];
  }
  return <ScorersClient initialRows={rows} />;
}
