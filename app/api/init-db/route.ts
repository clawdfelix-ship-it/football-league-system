import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/migrations';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Protect with ADMIN_SECRET
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      return NextResponse.json(
        { message: 'ADMIN_SECRET is not configured on the server' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (!providedSecret || providedSecret !== adminSecret) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
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
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await db.execute(sql`
        ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      await db.execute(sql`
        UPDATE announcements SET updated_at = created_at WHERE updated_at IS NULL;
      `);
      console.log('3. 檢查/創建 announcements 表完成');
    } catch (e) {
      console.log('announcements 表創建異常', e);
    }

    // 4. 確保 matches updated_at 欄位存在
    try {
      await db.execute(sql`
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `);
      await db.execute(sql`
        UPDATE matches SET updated_at = created_at WHERE updated_at IS NULL;
      `);
      console.log('4. 檢查/添加 matches.updated_at 欄位完成');
    } catch (e) {
      console.log('matches.updated_at 欄位檢查異常 (可能已存在)', e);
    }

    // 5. 確保 match_player_goals 表存在（神射手榜）
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS match_player_goals (
          id SERIAL PRIMARY KEY,
          match_id INTEGER NOT NULL,
          player_id INTEGER NOT NULL,
          goals INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT match_player_goals_match_player_unique UNIQUE (match_id, player_id)
        );
      `);
      console.log('5. 檢查/創建 match_player_goals 表完成');
    } catch (e) {
      console.log('match_player_goals 表創建異常', e);
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
