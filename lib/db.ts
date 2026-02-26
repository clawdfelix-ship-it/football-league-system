import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

let _db: ReturnType<typeof drizzle> | null = null;

// 懶加載數據庫連接
export const getDb = () => {
  if (_db) return _db;
  
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!databaseUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL or POSTGRES_URL is required in production');
    }
    console.warn('⚠️ No database connection string found. Database queries will fail.');
    return null;
  }
  
  const sql = neon(databaseUrl);
  _db = drizzle(sql);
  return _db;
};

// 導出 db 實例 - 使用時才初始化
export const db = new Proxy({} as any, {
  get(_target, prop) {
    const database = getDb();
    if (!database) {
      return () => { throw new Error('Database not initialized'); };
    }
    return (database as any)[prop];
  }
});

export { sql } from 'drizzle-orm';