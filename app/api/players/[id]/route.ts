import { NextRequest, NextResponse } from 'next/server';
import { deletePlayer } from '@/lib/player-actions-new';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const playerId = parseInt(id);
    
    if (isNaN(playerId)) {
      return NextResponse.json(
        { message: '無效的球員ID' },
        { status: 400 }
      );
    }

    const success = await deletePlayer(playerId);
    
    if (!success) {
      return NextResponse.json(
        { message: '球員不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: '球員刪除成功' });
  } catch (error) {
    console.error('刪除球員錯誤:', error);
    return NextResponse.json(
      { message: '刪除球員失敗' },
      { status: 500 }
    );
  }
}