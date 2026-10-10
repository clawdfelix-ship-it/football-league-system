import { pgTable, serial, varchar, integer, timestamp, text, uniqueIndex, jsonb, index } from 'drizzle-orm/pg-core';

// ============================================================
// Multi-tenant foundation (migration 0010)
// leagues = tenant root. Every tenant-owned row carries league_id.
// Existing single-league data is league #1 (hkbankleague2026).
// ============================================================
export const leagues = pgTable('leagues', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  sportType: varchar('sport_type', { length: 30 }).notNull().default('football'),
  // pending | trial | active | suspended | closed
  status: varchar('status', { length: 20 }).notNull().default('active'),
  plan: varchar('plan', { length: 30 }),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  logoUrl: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 30 }),
  bannerUrl: text('banner_url'),
  announcement: text('announcement'),
  aboutHtml: text('about_html'),
  rulesJson: jsonb('rules_json')
    .notNull()
    .default({ pointsWin: 3, pointsDraw: 1, pointsLoss: 0, sortBy: 'points' }),
  contactEmail: varchar('contact_email', { length: 200 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  customNav: jsonb('custom_nav').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// NOTE: teamId / homeTeamId / awayTeamId mirror the nullable FK columns added
// by migrations 0007 + 0009 (ON DELETE SET NULL). The legacy string columns
// (team / homeTeam / awayTeam) remain the source of truth for display; the
// *_id columns are kept in sync on write so the foreign keys stay valid.
// They are intentionally nullable to match the DB schema.

// 球員表
export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  jerseyNumber: integer('jersey_number'),
  position: varchar('position', { length: 50 }),
  team: varchar('team', { length: 100 }),
  teamId: integer('team_id'),
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
  leagueId: integer('league_id').notNull().default(1),
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
  mustChangePassword: timestamp('must_change_password'),
  passwordChangedAt: timestamp('password_changed_at'),
  // Platform admin rows carry NULL; league users are scoped. Default keeps the
  // current single-tenant inserts working until Phase 5 sets it explicitly.
  leagueId: integer('league_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 密碼重設 token 表
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  tokenHash: varchar('token_hash', { length: 128 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  leagueId: integer('league_id').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 比賽表
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  homeTeam: varchar('home_team', { length: 100 }).notNull(),
  awayTeam: varchar('away_team', { length: 100 }).notNull(),
  homeTeamId: integer('home_team_id'),
  awayTeamId: integer('away_team_id'),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  date: timestamp('date'), // Allow null for TBC
  venue: varchar('venue', { length: 100 }),
  status: varchar('status', { length: 20 }).default('scheduled'), // scheduled, finished, tbc
  round: varchar('round', { length: 20 }), // New field for Round 1-14
  leagueId: integer('league_id').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 場地公告表
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }),
  content: text('content').notNull(), // Venue address or details
  date: timestamp('date').notNull(), // Date and time of the event
  leagueId: integer('league_id').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 球隊表（球衣顏色 + 由 lib/constants.ts 搬入 DB 嘅展示 metadata）
export const teams = pgTable(
  'teams',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    homeKitColor: varchar('home_kit_color', { length: 20 }).default('white'),
    awayKitColor: varchar('away_kit_color', { length: 20 }).default('black'),
    // Migrated from hard-coded TEAMS (migration 0010); per-league metadata.
    shortName: varchar('short_name', { length: 20 }),
    nameZh: varchar('name_zh', { length: 200 }),
    colorGradient: varchar('color_gradient', { length: 100 }),
    leagueId: integer('league_id').notNull().default(1),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    // Team name unique PER LEAGUE (replaces the old global teams_name_key).
    leagueNameUnique: uniqueIndex('teams_league_id_name_key').on(table.leagueId, table.name),
    leagueIdx: index('idx_teams_league_id').on(table.leagueId),
  })
);

// 比賽球衣顏色 override（特定比賽嘅自訂顏色）
export const matchKitOverrides = pgTable(
  'match_kit_overrides',
  {
    id: serial('id').primaryKey(),
    matchId: integer('match_id').notNull(),
    teamName: varchar('team_name', { length: 100 }).notNull(),
    kitColor: varchar('kit_color', { length: 20 }).notNull(),
    leagueId: integer('league_id').notNull().default(1),
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
    leagueId: integer('league_id').notNull().default(1),
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
export type League = typeof leagues.$inferSelect;
export type NewLeague = typeof leagues.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type MatchPlayerGoals = typeof matchPlayerGoals.$inferSelect;
export type NewMatchPlayerGoals = typeof matchPlayerGoals.$inferInsert;
export type MatchKitOverride = typeof matchKitOverrides.$inferSelect;
export type NewMatchKitOverride = typeof matchKitOverrides.$inferInsert;
