import { pgTable, serial, varchar, integer, timestamp, text, date } from 'drizzle-orm/pg-core';

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

// 數據類型導出
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;