import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/migrations';
import { addPlayer, getPlayers } from '@/lib/player-actions-new';

export async function POST(request: NextRequest) {
  try {
    // 1. 初始化資料庫表結構
    console.log('1. 開始初始化資料庫...');
    await initializeDatabase();
    
    // 2. 檢查是否已有球員數據
    console.log('2. 檢查現有球員數據...');
    const players = await getPlayers();
    
    // 3. 如果沒有球員，添加一個測試球員
    if (players.length === 0) {
      console.log('3. 添加測試球員...');
      await addPlayer({
        name: '測試球員',
        jerseyNumber: 10,
        position: '前鋒',
        team: '曼城',
        age: 25,
        nationality: '香港',
        height: 175,
        weight: 70,
        joinedDate: new Date(),
        status: 'active',
        photoUrl: '',
        phoneNumber: '12345678',
        email: 'test@example.com',
        emergencyContact: '緊急聯絡人',
        notes: '這是測試球員',
        identityPrefix: 'A12' // 必填欄位
      });
      console.log('4. 測試球員添加成功');
    } else {
      console.log(`3. 已有 ${players.length} 名球員，跳過種子數據`);
    }

    return NextResponse.json({ message: '數據庫初始化成功' });
  } catch (error) {
    console.error('數據庫初始化失敗:', error);
    return NextResponse.json(
      { message: '數據庫初始化失敗', error: (error as Error).message },
      { status: 500 }
    );
  }
}
