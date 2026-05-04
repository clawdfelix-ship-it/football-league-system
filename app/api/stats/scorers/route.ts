import { ok } from '@/lib/api/response';
import { listScorers } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function errorText(e: unknown) {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export async function GET() {
  try {
    const rows = await listScorers();
    return ok({ scorers: rows }, { headers: { 'cache-control': 'no-store' } });
  } catch (e) {
    const msg = errorText(e);
    if (msg.includes('match_player_goals') && msg.includes('does not exist')) {
      return ok({ scorers: [] }, { headers: { 'cache-control': 'no-store' } });
    }
    if (msg.includes('permission denied') && msg.includes('match_player_goals')) {
      return ok({ scorers: [] }, { headers: { 'cache-control': 'no-store' } });
    }
    return ok({ scorers: [] }, { headers: { 'cache-control': 'no-store' } });
  }
}
