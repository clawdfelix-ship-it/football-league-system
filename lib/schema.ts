import { pgTable, serial, varchar, integer, timestamp, text, uniqueIndex } from 'drizzle-orm/pg-core';

// 球員表
export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  jerseyNumber: integer('jersey_number'),
  position: varchar('position', { length: 50 }),
  team: varchar('team', { length: 100 }),
  age: integer('age'),
  nationality: varchar('nationality', { length: 50 }),
  height: integer('height'),
  weight: integer('weight'),
  joinedDate: timestamp('joined_date').defaultNow(),
  status: varchar('status', { length: 20 }).default('active'),
  photoUrl: text('photo_url'),
  phoneNumber: varchar('phone_number', { length: 20 }),
  email: varchar('email', { length: 100 }),
  emergencyContact: text('emergency_contact'),
  notes: text('notes'),
  identityPrefix: varchar('identity_prefix', { length: 10 }), // New field for first 3 chars of ID
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 用戶表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 比賽表
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  homeTeam: varchar('home_team', { length: 100 }).notNull(),
  awayTeam: varchar('away_team', { length: 100 }).notNull(),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  date: timestamp('date'), // Allow null for TBC
  venue: varchar('venue', { length: 100 }),
  status: varchar('status', { length: 20 }).default('scheduled'), // scheduled, finished, tbc
  round: varchar('round', { length: 20 }), // New field for Round 1-14
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 場地公告表
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }),
  content: text('content').notNull(), // Venue address or details
  date: timestamp('date').notNull(), // Date and time of the event
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 球隊表（球衣顏色）
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  homeKitColor: varchar('home_kit_color', { length: 20 }).default('white'),
  awayKitColor: varchar('away_kit_color', { length: 20 }).default('black'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 比賽球衣顏色 override（特定比賽嘅自訂顏色）
export const matchKitOverrides = pgTable(
  'match_kit_overrides',
  {
    id: serial('id').primaryKey(),
    matchId: integer('match_id').notNull(),
    teamName: varchar('team_name', { length: 100 }).notNull(),
    kitColor: varchar('kit_color', { length: 20 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    matchTeamUnique: uniqueIndex('match_kit_overrides_match_team_unique').on(table.matchId, table.teamName),
  })
);

// 比賽球員入球（用於神射手榜）
export const matchPlayerGoals = pgTable(
  'match_player_goals',
  {
    id: serial('id').primaryKey(),
    matchId: integer('match_id').notNull(),
    playerId: integer('player_id').notNull(),
    goals: integer('goals').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    matchPlayerUnique: uniqueIndex('match_player_goals_match_player_unique').on(table.matchId, table.playerId),
  })
);

// 數據類型導出
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type MatchPlayerGoals = typeof matchPlayerGoals.$inferSelect;
export type NewMatchPlayerGoals = typeof matchPlayerGoals.$inferInsert;
export type MatchKitOverride = typeof matchKitOverrides.$inferSelect;
export type NewMatchKitOverride = typeof matchKitOverrides.$inferInsert;
