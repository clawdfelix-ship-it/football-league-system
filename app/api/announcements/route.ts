import { ok, fail } from '@/lib/api/response';
import { listAnnouncements } from '@/lib/queries';

export const revalidate = 10;

export async function GET() {
  try {
    const rows = await listAnnouncements();
    return ok({ announcements: rows });
  } catch {
    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch announcements');
  }
}
