import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Create a single instance
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.warn('⚠️ No database connection string found. Database queries will fail.');
}

// Export sql for direct usage if needed
export const sql = databaseUrl ? neon(databaseUrl) : undefined;

// Export db instance
type Db = ReturnType<typeof drizzle>;

const missingDb = new Proxy(
  {},
  {
    get() {
      throw new Error('DATABASE_URL or POSTGRES_URL is required');
    },
  }
) as unknown as Db;

export const db: Db = databaseUrl ? drizzle(neon(databaseUrl)) : missingDb;
