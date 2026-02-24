import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// 優先使用 DATABASE_URL，如果沒有則嘗試使用 Vercel Postgres 默認的 POSTGRES_URL
// 在構建時，如果環境變量都不存在，使用一個符合格式的假 URL 避免報錯
const databaseUrl = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  'postgresql://dummy:dummy@dummy.com/dummy';

if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  console.warn('⚠️ No database connection string found (DATABASE_URL or POSTGRES_URL). Using dummy connection string for build/static analysis.');
}

// 創建數據庫連接
const sql = neon(databaseUrl);
export const db = drizzle(sql);

// 導出數據庫實例
export { sql };