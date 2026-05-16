import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { matchKitOverrides } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/matches/[id]/kit-overrides - 獲取某場比賽嘅所有球衣 override
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const matchId = parseInt(params.id);
    if (isNaN(matchId)) {
      return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 });
    }

    const overrides = await db
      .select()
      .from(matchKitOverrides)
      .where(eq(matchKitOverrides.matchId, matchId));

    // 轉成方便前端用嘅格式
    const result: Record<string, string> = {};
    for (const override of overrides) {
      result[override.teamName.trim().toUpperCase()] = override.kitColor;
    }

    return NextResponse.json({
      matchId,
      overrides: result,
      raw: overrides,
    });
  } catch (error) {
    console.error('Failed to get kit overrides:', error);
    // 就算 DB error 都 return empty overrides，唔好 crash 前端
    return NextResponse.json({
      matchId: parseInt(params.id),
      overrides: {},
      error: String(error),
    });
  }
}

// PUT /api/matches/[id]/kit-overrides - 設置/更新 override
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const normalizedTeamName = teamName.trim().toUpperCase();
    const now = new Date();

    // Check if exists
    const existing = await db
      .select()
      .from(matchKitOverrides)
      .where(
        and(
          eq(matchKitOverrides.matchId, matchId),
          eq(matchKitOverrides.teamName, normalizedTeamName)
        )
      );

    if (existing.length > 0) {
      // Update
      await db
        .update(matchKitOverrides)
        .set({ kitColor, updatedAt: now })
        .where(eq(matchKitOverrides.id, existing[0].id));
    } else {
      // Insert
      await db.insert(matchKitOverrides).values({
        matchId,
        teamName: normalizedTeamName,
        kitColor,
        createdAt: now,
        updatedAt: now,
      });
    }

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

    await db
      .delete(matchKitOverrides)
      .where(
        and(
          eq(matchKitOverrides.matchId, matchId),
          eq(matchKitOverrides.teamName, normalizedTeamName)
        )
      );

    return NextResponse.json({
      success: true,
      matchId,
      teamName: normalizedTeamName,
    });
  } catch (error) {
    console.error('Failed to delete kit override:', error);
    return NextResponse.json(
      { error: 'Failed to delete kit override' },
      { status: 500 }
    );
  }
}
