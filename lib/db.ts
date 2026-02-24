import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// 創建數據庫連接
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// 導出數據庫實例
export { sql };