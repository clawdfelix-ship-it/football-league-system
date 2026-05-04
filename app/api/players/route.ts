import { NextRequest } from 'next/server';
import { getAuthContext, getTeamNameFromTeamId } from '@/lib/authz';
import { createPlayer, listPublicPlayers } from '@/lib/queries';
import { fail, ok } from '@/lib/api/response';
import { CreatePlayerSchema } from '@/lib/api/schemas';
import { zodDetails } from '@/lib/api/zod';

export const revalidate = 10;

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return fail(401, 'UNAUTHORIZED', 'Unauthorized');
    }

    const body = CreatePlayerSchema.parse(await request.json());
    
    let teamName: string | null =
      auth.role === 'manager' ? getTeamNameFromTeamId(auth.teamId) : body.team ?? null;

    if (teamName) {
      teamName = teamName.trim().toUpperCase();
    }

    if (auth.role === 'manager' && !teamName) {
      return fail(403, 'FORBIDDEN', 'Forbidden');
    }

    if (!teamName) {
      return fail(400, 'VALIDATION_ERROR', 'team 是必填欄位');
    }

    // 創建新球員
    const newPlayer = await createPlayer({
      name: body.name,
      jerseyNumber: body.jerseyNumber,
      position: body.position,
      team: teamName,
      age: body.age,
      nationality: body.nationality ?? undefined,
      height: body.height ?? undefined,
      weight: body.weight ?? undefined,
      joinedDate: body.joinedDate ?? undefined,
      status: body.status ?? undefined,
      phoneNumber: body.phoneNumber ?? undefined,
      email: body.email ?? undefined,
      emergencyContact: body.emergencyContact ?? undefined,
      notes: body.notes ?? undefined,
      photoUrl: body.photoUrl ?? undefined,
      identityPrefix: body.identityPrefix ?? undefined,
    });

    if (!newPlayer) {
      return fail(500, 'INTERNAL_ERROR', '球員登記失敗，請稍後再試');
    }

    return ok({ message: '球員登記成功', player: newPlayer }, { status: 201 });

  } catch (error) {
    console.error('球員登記錯誤:', error);
    const details = zodDetails(error);
    if (details) return fail(400, 'VALIDATION_ERROR', 'Invalid request body', details);
    return fail(500, 'INTERNAL_ERROR', '球員登記失敗，請稍後再試');
  }
}

export async function GET() {
  try {
    const players = await listPublicPlayers();
    return ok({ players });
  } catch (error) {
    console.error('獲取球員列表錯誤:', error);
    return fail(500, 'INTERNAL_ERROR', '獲取球員列表失敗');
  }
}
