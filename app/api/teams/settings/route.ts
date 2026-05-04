import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { TeamSettingsSchema } from '@/lib/api/schemas';
import { zodDetails } from '@/lib/api/zod';
import { getAuthContext, getTeamNameFromTeamId } from '@/lib/authz';
import { listTeamSettings, upsertTeamSettings } from '@/lib/queries';

export const revalidate = 10;

export async function GET() {
  try {
    const rows = await listTeamSettings();
    return ok({
      teams: rows.map((t) => ({
        id: t.id,
        name: t.name,
        homeKitColor: t.homeKitColor,
        awayKitColor: t.awayKitColor,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  } catch {
    return fail(500, 'INTERNAL_ERROR', 'Failed to fetch team settings');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return fail(401, 'UNAUTHENTICATED', 'Unauthorized');

    const body = await request.json().catch(() => ({}));
    const record =
      body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
    const managerTeamName =
      auth.role === 'manager' ? (getTeamNameFromTeamId(auth.teamId) ?? null) : null;
    if (auth.role === 'manager' && !managerTeamName) {
      return fail(403, 'FORBIDDEN', 'Manager team is not configured');
    }

    let input: { teamName: string; homeKitColor: string; awayKitColor: string };
    try {
      input = TeamSettingsSchema.parse({
        teamName: managerTeamName ?? record.teamName,
        homeKitColor: record.homeKitColor,
        awayKitColor: record.awayKitColor,
      });
    } catch (e) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid request body', zodDetails(e));
    }

    const teamName = input.teamName.toUpperCase();

    const team = await upsertTeamSettings({
      name: teamName,
      homeKitColor: input.homeKitColor,
      awayKitColor: input.awayKitColor,
    });

    if (!team) {
      return fail(500, 'INTERNAL_ERROR', 'Failed to update team settings');
    }

    return ok({
      message: 'Team kit colors updated successfully',
      team: {
        id: team.id,
        name: team.name,
        homeKitColor: team.homeKitColor,
        awayKitColor: team.awayKitColor,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      },
    });
  } catch {
    return fail(500, 'INTERNAL_ERROR', 'Failed to update team settings');
  }
}
