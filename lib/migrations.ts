import { sql } from 'drizzle-orm';
import { db } from './db';

// 創建球員表
export async function createPlayersTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      jersey_number INTEGER,
      position VARCHAR(50),
      team VARCHAR(100),
      age INTEGER,
      nationality VARCHAR(50),
      height INTEGER,
      weight INTEGER,
      joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'active',
      photo_url TEXT,
      phone_number VARCHAR(20),
      email VARCHAR(100),
      emergency_contact TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// 創建用戶表
export async function createUsersTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(100) UNIQUE NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// 創建比賽表
export async function createMatchesTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      home_team VARCHAR(100) NOT NULL,
      away_team VARCHAR(100) NOT NULL,
      home_score INTEGER,
      away_score INTEGER,
      date TIMESTAMP NOT NULL,
      venue VARCHAR(100),
      status VARCHAR(20) DEFAULT 'scheduled',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// 初始化數據庫
export async function initializeDatabase() {
  try {
    await createPlayersTable();
    await createUsersTable();
    await createMatchesTable();
    console.log('數據庫初始化成功');
  } catch (error) {
    console.error('數據庫初始化失敗:', error);
    throw error;
  }
}