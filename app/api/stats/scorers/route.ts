import { ok, fail } from '@/lib/api/response';
import { listScorers } from '@/lib/queries';

export const revalidate = 10;

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
    return ok({ scorers: rows });
  } catch (e) {
    const msg = errorText(e);
    if (msg.includes('match_player_goals') && msg.includes('does not exist')) {
      return ok({ scorers: [] });
    }
    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch scorers');
  }
}
