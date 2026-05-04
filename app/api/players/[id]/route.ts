import { NextRequest } from 'next/server';
import { getAuthContext, getTeamNameFromTeamId } from '@/lib/authz';
import { deletePlayerById, getPlayerTeamById } from '@/lib/queries';
import { fail, ok } from '@/lib/api/response';
import { DeleteByIdParamSchema } from '@/lib/api/schemas';
import { zodDetails } from '@/lib/api/zod';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return fail(401, 'UNAUTHORIZED', 'Unauthorized');
    }

    const { id } = await params;
    const parsed = DeleteByIdParamSchema.parse({ id });
    const playerId = parsed.id;

    if (auth.role === 'manager') {
      const teamName = getTeamNameFromTeamId(auth.teamId);
      if (!teamName) {
        return fail(403, 'FORBIDDEN', 'Forbidden');
      }

      const playerTeam = await getPlayerTeamById(playerId);
      if (!playerTeam) {
        return fail(404, 'NOT_FOUND', '球員不存在');
      }

      if (playerTeam !== teamName) {
        return fail(403, 'FORBIDDEN', 'Forbidden');
      }
    }

    const deleted = await deletePlayerById(playerId);
    if (!deleted) {
      return fail(404, 'NOT_FOUND', '球員不存在');
    }

    return ok({ message: '球員刪除成功' });
  } catch (error) {
    console.error('刪除球員錯誤:', error);
    const details = zodDetails(error);
    if (details) return fail(400, 'VALIDATION_ERROR', 'Invalid request', details);
    return fail(500, 'INTERNAL_ERROR', '刪除球員失敗');
  }
}
