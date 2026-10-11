import { NextRequest, NextResponse } from 'next/server';
import { createMatchKitOverridesTable } from '@/lib/migrations';
import { getAuthContext } from '@/lib/authz';
import { fail } from '@/lib/api/response';
import { revalidateFixturesForLeague } from '@/lib/fixtures-data';
import {
  getMatchKitOverrides,
  setMatchKitOverride,
  deleteMatchKitOverride,
} from '@/lib/matchKitOverrides.server';
import { getMatchById } from '@/lib/queries';

// 自動創建 table (如果唔存在) - 一定要有 try-catch，唔可以死
async function ensureTableExists() {
  try {
    await createMatchKitOverridesTable();
    return true;
  } catch (e) {
    console.log('Table might already exist or error creating:', e);
    return false;
  }
}

// GET /api/matches/[id]/kit-overrides - 獲取某場比賽嘅所有球衣 override
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await ensureTableExists();

  const params = await context.params;
  try {
    const matchId = parseInt(params.id);
    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    // SCOPED: the match must belong to the current league, else the scoped
    // helpers resolve to league 0 / no rows. Previously this was an unscoped
    // query keyed only on match_id, leaking another tenant's kit config by id.
    const match = await getMatchById(matchId);
    if (!match) {
      // Do not reveal whether the id exists in another league.
      return NextResponse.json({ matchId, overrides: {}, raw: [] });
    }

    const overrides = await getMatchKitOverrides(matchId);

    return NextResponse.json({
      matchId,
      overrides,
    });
  } catch (error) {
    console.error('Failed to get kit overrides:', error);
    return NextResponse.json({
      matchId: parseInt(params.id),
      error: String(error),
    }, { status: 500 });
  }
}

// PUT /api/matches/[id]/kit-overrides - 設置/更新 override
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext();
  if (!auth) {
    return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
  }
  if (auth.role !== 'admin') {
    return fail(403, 'FORBIDDEN', 'Admin access required');
  }

  await ensureTableExists();

  const params = await context.params;
  try {
    const matchId = parseInt(params.id);
    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const body = await request.json();
    const { teamName, kitColor } = body;

    if (!teamName || !kitColor) {
      return NextResponse.json(
        { error: 'teamName and kitColor are required' },
        { status: 400 }
      );
    }

    // SCOPED existence check: the match must be in THIS league. The scoped
    // helper also stamps league_id on the written row (no more silent DEFAULT 1).
    const match = await getMatchById(matchId);
    if (!match) {
      return fail(404, 'NOT_FOUND', 'Match not found in this league');
    }

    const normalizedTeamName = teamName.trim().toUpperCase();

    await setMatchKitOverride(matchId, normalizedTeamName, kitColor);

    await revalidateFixturesForLeague();

    return NextResponse.json({
      success: true,
      matchId,
      teamName: normalizedTeamName,
      kitColor,
    });
  } catch (error) {
    console.error('Failed to set kit override:', error);
    return NextResponse.json(
      { error: 'Failed to set kit override', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/matches/[id]/kit-overrides - 刪除 override
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext();
  if (!auth) {
    return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
  }
  if (auth.role !== 'admin') {
    return fail(403, 'FORBIDDEN', 'Admin access required');
  }

  await ensureTableExists();

  const params = await context.params;
  try {
    const matchId = parseInt(params.id);
    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const body = await request.json();
    const { teamName } = body;

    if (!teamName) {
      return NextResponse.json(
        { error: 'teamName is required' },
        { status: 400 }
      );
    }

    const normalizedTeamName = teamName.trim().toUpperCase();

    await deleteMatchKitOverride(matchId, normalizedTeamName);

    await revalidateFixturesForLeague();

    return NextResponse.json({
      success: true,
      matchId,
      teamName: normalizedTeamName,
    });
  } catch (error) {
    console.error('Failed to delete kit override:', error);
    return NextResponse.json(
      { error: 'Failed to delete kit override', details: String(error) },
      { status: 500 }
    );
  }
}
