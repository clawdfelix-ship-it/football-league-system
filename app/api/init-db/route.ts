import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/migrations';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // 1. 初始化資料庫表結構
    console.log('1. 開始初始化資料庫...');
    await initializeDatabase();
    
    // 2. 確保 identity_prefix 欄位存在
    try {
      await db.execute(sql`
        ALTER TABLE players ADD COLUMN IF NOT EXISTS identity_prefix VARCHAR(10);
      `);
      console.log('2. 檢查/添加 identity_prefix 欄位完成');
    } catch (e) {
      console.log('identity_prefix 欄位檢查異常 (可能已存在)', e);
    }

    // 3. 確保 announcements 表存在 (initializeDatabase 已包含，但為確保舊代碼相容性再次確認)
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS announcements (
          id SERIAL PRIMARY KEY,
          title VARCHAR(200),
          content TEXT NOT NULL,
          date TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('3. 檢查/創建 announcements 表完成');
    } catch (e) {
      console.log('announcements 表創建異常', e);
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
