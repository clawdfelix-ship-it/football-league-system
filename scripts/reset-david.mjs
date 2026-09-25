import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`SELECT id, email, username, role FROM users WHERE id = 11`;
console.log('BEFORE:', JSON.stringify(rows));

if (!rows[0]) throw new Error('user id=11 not found');

const digits = String(randomInt(0, 1_000_000)).padStart(6, '0');
const tempPassword = `Scb${digits}#`;
const hash = await bcrypt.hash(tempPassword, 10);

await sql`
  UPDATE users
  SET password_hash = ${hash},
      must_change_password = now()
  WHERE id = 11
`;

const after = await sql`
  SELECT id, email, username, role, must_change_password FROM users WHERE id = 11
`;
console.log('AFTER:', JSON.stringify(after));
console.log('TEMP_PASSWORD:', tempPassword);
