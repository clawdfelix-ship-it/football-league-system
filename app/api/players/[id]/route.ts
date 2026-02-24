import { NextRequest, NextResponse } from 'next/server';
import { getPlayerById, updatePlayer, deletePlayer } from '@/lib/player-actions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      return NextResponse.json({ message: '無效的ID' }, { status: 400 });
    }

    const existing = getPlayerById(numericId);
    if (!existing) {
      return NextResponse.json({ message: '球員不存在' }, { status: 404 });
    }

    const body = await request.json();
    const updated = updatePlayer(numericId, {
      ...body,
    });
    return NextResponse.json({ message: '更新成功', player: updated });
  } catch (e) {
    return NextResponse.json({ message: '更新失敗' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      return NextResponse.json({ message: '無效的ID' }, { status: 400 });
    }

    const ok = deletePlayer(numericId);
    if (!ok) {
      return NextResponse.json({ message: '球員不存在' }, { status: 404 });
    }
    return NextResponse.json({ message: '刪除成功' }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ message: '刪除失敗' }, { status: 500 });
  }
}
