import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// 在構建時，如果環境變量不存在，使用一個符合格式的假 URL 避免報錯
// 但在運行時必須要有真實的 DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy.com/dummy';

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL is not set. Using dummy connection string for build/static analysis.');
}

// 創建數據庫連接
const sql = neon(databaseUrl);
export const db = drizzle(sql);

// 導出數據庫實例
export { sql };