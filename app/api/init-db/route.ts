import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/api/response';
import { getClientIp, rateLimit } from '@/lib/api/rate-limit';
import { getAuthContext } from '@/lib/authz';
import { initializeDatabase } from '@/lib/migrations';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    // Tightened from 20 → 5 per 10min: this endpoint should fire at most once
    // per environment. Legitimate callers shouldn't hit this limit.
    const rl = rateLimit(`init-db:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    if (!rl.allowed) return fail(429, 'RATE_LIMITED', 'Too many requests');

    const auth = await getAuthContext();
    const isAdminSession = auth?.role === 'admin';

    const adminSecret = process.env.ADMIN_SECRET;
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace(/^Bearer\s+/i, '').trim();
    const isSecretOk = Boolean(adminSecret && providedSecret && providedSecret === adminSecret);
    if (!isAdminSession && !isSecretOk) {
      return fail(401, 'UNAUTHENTICATED', 'Unauthorized');
    }
    // 1. 初始化資料庫表結構
    await initializeDatabase();
    
    // 2. 確保 identity_prefix 欄位存在
    try {
      await db.execute(sql`
        ALTER TABLE players ADD COLUMN IF NOT EXISTS identity_prefix VARCHAR(10);
      `);
      console.log('2. 檢查/添加 identity_prefix 欄位完成');
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
    }
    
    return ok({ message: '數據庫初始化成功' });
  } catch (error) {
    return fail(
      500,
      'INTERNAL_ERROR',
      '數據庫初始化失敗',
      error instanceof Error ? error.message : String(error)
    );
  }
}
