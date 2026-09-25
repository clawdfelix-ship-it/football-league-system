import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const host = process.argv[2];
// extract password from DATABASE_URL
const m = process.env.DATABASE_URL.match(/:[^:@/]+@/);
const pw = m[0].slice(1, -1);
const url = `postgresql://neondb_owner:***@${host}/neondb?sslmode=require`;
const sql = neon(url);
try {
  const r = await sql`SELECT count(*) FROM matches`;
  console.log('OK', host, JSON.stringify(r));
} catch (e) {
  console.log('FAIL', host, '|', e.message.slice(0, 120));
}
