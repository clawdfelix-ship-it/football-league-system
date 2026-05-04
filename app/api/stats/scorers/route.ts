import { ok, fail } from '@/lib/api/response';
import { listScorers } from '@/lib/queries';

export const revalidate = 10;

export async function GET() {
  try {
    const rows = await listScorers();
    return ok({ scorers: rows });
  } catch {
    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch scorers');
  }
}
