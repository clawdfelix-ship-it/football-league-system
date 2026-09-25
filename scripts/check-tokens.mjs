import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);
const r = await sql`SELECT id, user_id, expires_at, used_at FROM password_reset_tokens ORDER BY created_at DESC LIMIT 3`;
console.log(JSON.stringify(r));
