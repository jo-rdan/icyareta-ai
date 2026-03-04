import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const packTypeEnum = pgEnum("pack_type", [
  "diagnostic",
  "daily_drill",
  "full_mock",
]);

// --- Users Table ---
export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  phoneNumber: text().notNull().unique(), // Maps to phone_number
  childName: text(), // Maps to child_name
  createdAt: timestamp().defaultNow().notNull(), // Maps to created_at
});

// --- Lookup Table: Subjects ---
export const subjects = pgTable("subjects", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull().unique(),
});

// --- Defines pack types and prices ---
export const examPacks = pgTable("exam_packs", {
  id: uuid().defaultRandom().primaryKey(),
  subjectId: uuid()
    .references(() => subjects.id)
    .notNull(),
  packType: packTypeEnum().notNull(),
  price: integer().notNull(),
});

// --- Tracks active purchases ---
export const userPurchases = pgTable("user_purchases", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .references(() => users.id)
    .notNull(),
  packId: uuid()
    .references(() => examPacks.id)
    .notNull(),
  isActive: boolean().default(true).notNull(),
  purchasedAt: timestamp().defaultNow().notNull(),
});

// --- Core Content Storage ---
export const questions = pgTable("questions", {
  id: uuid().defaultRandom().primaryKey(),
  subjectId: uuid()
    .references(() => subjects.id)
    .notNull(),
  packId: uuid()
    .references(() => examPacks.id)
    .notNull(),
  questionText: text().notNull(),

  // 🔥 CHANGE THIS: Store options as a JSON object (e.g., {"A": "...", "B": "..."})
  options: jsonb().notNull(),

  correctOption: text().notNull(), // Stores the key (e.g., "A")
  explanation: text(),
  year: integer().notNull(),
});

// --- Stores detailed session history ---
export const sessionLogs = pgTable("session_logs", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .references(() => users.id)
    .notNull(),
  sessionId: text().notNull(),
  lastMenu: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});

// --- Stores final results ---
export const examResults = pgTable("exam_results", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .references(() => users.id)
    .notNull(),
  packId: uuid()
    .references(() => examPacks.id)
    .notNull(),
  score: integer().notNull(),
  totalQuestions: integer().notNull(),
  takenAt: timestamp().defaultNow().notNull(),
});

// --- Relations ---
export const usersRelations = relations(users, ({ many }) => ({
  purchases: many(userPurchases),
  results: many(examResults),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  packs: many(examPacks),
  questions: many(questions),
}));

export const examPacksRelations = relations(examPacks, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [examPacks.subjectId],
    references: [subjects.id],
  }),
  questions: many(questions),
  purchases: many(userPurchases),
}));

export const userPurchasesRelations = relations(userPurchases, ({ one }) => ({
  user: one(users, { fields: [userPurchases.userId], references: [users.id] }),
  pack: one(examPacks, {
    fields: [userPurchases.packId],
    references: [examPacks.id],
  }),
}));
