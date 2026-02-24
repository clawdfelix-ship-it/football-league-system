import { NextRequest, NextResponse } from 'next/server';
import { addPlayer, getPlayers } from '@/lib/player-actions-new';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 驗證必填欄位
    const requiredFields = ['name', 'jerseyNumber', 'position', 'team', 'age'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { message: `${field} 是必填欄位` },
          { status: 400 }
        );
      }
    }

    // 驗證數值範圍
    if (body.jerseyNumber < 1 || body.jerseyNumber > 99) {
      return NextResponse.json(
        { message: '球衣號碼必須在 1-99 之間' },
        { status: 400 }
      );
    }

    if (body.age < 16 || body.age > 50) {
      return NextResponse.json(
        { message: '年齡必須在 16-50 歲之間' },
        { status: 400 }
      );
    }

    if (body.height && (body.height < 150 || body.height > 220)) {
      return NextResponse.json(
        { message: '身高必須在 150-220cm 之間' },
        { status: 400 }
      );
    }

    if (body.weight && (body.weight < 50 || body.weight > 120)) {
      return NextResponse.json(
        { message: '體重必須在 50-120kg 之間' },
        { status: 400 }
      );
    }

    // 創建新球員
    const newPlayer = await addPlayer({
      name: body.name.trim(),
      jerseyNumber: body.jerseyNumber,
      position: body.position,
      team: body.team,
      age: body.age,
      nationality: body.nationality?.trim() || '',
      height: body.height || 0,
      weight: body.weight || 0,
      joinedDate: new Date(body.joinedDate || new Date()),
      status: body.status || 'active',
      phoneNumber: body.phoneNumber?.trim() || '',
      email: body.email?.trim() || '',
      emergencyContact: body.emergencyContact?.trim() || '',
      notes: body.notes?.trim() || '',
      photoUrl: body.photoUrl || ''
    });

    return NextResponse.json({
      message: '球員登記成功',
      player: newPlayer
    }, { status: 201 });

  } catch (error) {
    console.error('球員登記錯誤:', error);
    const message = error instanceof Error ? error.message : '球員登記失敗，請稍後再試';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const players = await getPlayers();
    return NextResponse.json({ players });
  } catch (error) {
    console.error('獲取球員列表錯誤:', error);
    return NextResponse.json(
      { message: '獲取球員列表失敗' },
      { status: 500 }
    );
  }
}