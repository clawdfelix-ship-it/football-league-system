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
      identity_prefix VARCHAR(10),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Add column if it doesn't exist (for existing tables)
  try {
    await db.execute(sql`
      ALTER TABLE players ADD COLUMN IF NOT EXISTS identity_prefix VARCHAR(10);
    `);
  } catch (e) {
    console.log('Column identity_prefix might already exist or error adding it', e);
  }
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
      date TIMESTAMP,
      venue VARCHAR(100),
      status VARCHAR(20) DEFAULT 'scheduled',
      round VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add round column if it doesn't exist (for existing tables)
  try {
    await db.execute(sql`
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS round VARCHAR(20);
    `);

    await db.execute(sql`
      ALTER TABLE matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    
    // Modify date column to be nullable
    await db.execute(sql`
      ALTER TABLE matches ALTER COLUMN date DROP NOT NULL;
    `);

    await db.execute(sql`
      UPDATE matches SET updated_at = created_at WHERE updated_at IS NULL;
    `);
  } catch (e) {
    console.log('Error migrating matches table', e);
  }
}

// 創建公告表
export async function createAnnouncementsTable() {
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

  try {
    await db.execute(sql`
      ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    await db.execute(sql`
      UPDATE announcements SET updated_at = created_at WHERE updated_at IS NULL;
    `);
  } catch (e) {
    console.log('Error migrating announcements table', e);
  }
}

// 創建比賽球員入球表（神射手榜）
export async function createMatchPlayerGoalsTable() {
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
}

export async function createIndexesAndConstraints() {
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_players_team ON players(team);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_players_team_jersey ON players(team, jersey_number);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_matches_status_date ON matches(status, date);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_match_player_goals_match_id ON match_player_goals(match_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_match_player_goals_player_id ON match_player_goals(player_id);`);

  await db.execute(sql`
    DO $$
    BEGIN
      ALTER TABLE matches
        ADD CONSTRAINT matches_status_check
        CHECK (status IN ('scheduled','finished','tbc')) NOT VALID;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      ALTER TABLE players
        ADD CONSTRAINT players_status_check
        CHECK (status IN ('active','injured','suspended','inactive')) NOT VALID;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      ALTER TABLE match_player_goals
        ADD CONSTRAINT match_player_goals_goals_check
        CHECK (goals >= 0) NOT VALID;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      ALTER TABLE match_player_goals
        ADD CONSTRAINT match_player_goals_match_fk
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      ALTER TABLE match_player_goals
        ADD CONSTRAINT match_player_goals_player_fk
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END $$;
  `);
}

// 創建比賽球衣 override 表
export async function createMatchKitOverridesTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS match_kit_overrides (
      id SERIAL PRIMARY KEY,
      match_id INTEGER NOT NULL,
      team_name VARCHAR(100) NOT NULL,
      kit_color VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(match_id, team_name)
    );
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      ALTER TABLE match_kit_overrides
        ADD CONSTRAINT match_kit_overrides_match_fk
        FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END $$;
  `);
}

// 初始化數據庫
export async function initializeDatabase() {
  try {
    await createPlayersTable();
    await createUsersTable();
    await createMatchesTable();
    await createAnnouncementsTable();
    await createMatchPlayerGoalsTable();
    await createMatchKitOverridesTable();
    await createIndexesAndConstraints();
    console.log('數據庫初始化成功');
  } catch (error) {
    console.error('數據庫初始化失敗:', error);
    throw error;
  }
}
