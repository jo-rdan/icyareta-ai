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

// ─── Enums ────────────────────────────────────────────────────────────────────

export const packTypeEnum = pgEnum("pack_type", [
  "diagnostic",
  "daily_drill",
  "full_mock",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "in_progress",
  "completed",
  "abandoned",
]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  phoneNumber: text().notNull().unique(),
  childName: text(),
  createdAt: timestamp().defaultNow().notNull(),
});

// ─── Subjects ─────────────────────────────────────────────────────────────────

export const subjects = pgTable("subjects", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull().unique(),
});

// ─── Exam Packs ───────────────────────────────────────────────────────────────

export const examPacks = pgTable("exam_packs", {
  id: uuid().defaultRandom().primaryKey(),
  subjectId: uuid()
    .references(() => subjects.id)
    .notNull(),
  packType: packTypeEnum().notNull(),
  price: integer().notNull(),
});

// ─── User Purchases ───────────────────────────────────────────────────────────
// The permission gate. Every question served must have a valid row here.
//
// Bundle purchases create one row per subject (4 rows total) in a single
// transaction. They are linked by sharing the same transactionReference.
// isBundle = true flags all 4 rows as part of a bundle purchase.
// bundlePrice stores what the user actually paid (2500, 4500, or 9000 RWF)
// for reconciliation and SMS receipts — since each row's pack.price is 500/1000/2000.

export const userPurchases = pgTable("user_purchases", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .references(() => users.id)
    .notNull(),
  packId: uuid()
    .references(() => examPacks.id)
    .notNull(),
  transactionReference: text(), // AT transaction ref for reconciliation
  isActive: boolean().default(true).notNull(),
  isBundle: boolean().default(false).notNull(),
  bundlePrice: integer(), // total amount paid for bundle (null for single purchases)
  purchasedAt: timestamp().defaultNow().notNull(),
  expiresAt: timestamp().notNull(), // purchasedAt + 24 hours
});

// ─── Questions ────────────────────────────────────────────────────────────────

export const questions = pgTable("questions", {
  id: uuid().defaultRandom().primaryKey(),
  subjectId: uuid()
    .references(() => subjects.id)
    .notNull(),
  packId: uuid()
    .references(() => examPacks.id)
    .notNull(),
  questionText: text().notNull(),
  options: jsonb().notNull(), // { "A": "...", "B": "...", "C": "...", "D": "..." }
  correctOption: text().notNull(), // "A" | "B" | "C" | "D"
  explanation: text(),
  year: integer().notNull(),
});

// ─── Session Logs ─────────────────────────────────────────────────────────────
// Stores live session state. This is what enables quiz checkpointing.
// When a USSD session times out, progress is preserved here.
// On re-dial, we read this table to resume exactly where the user stopped.

export const sessionLogs = pgTable("session_logs", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .references(() => users.id)
    .notNull(),
  sessionId: text().notNull().unique(),
  selectedSubjectId: uuid().references(() => subjects.id),
  selectedPackId: uuid().references(() => examPacks.id),
  currentQuestionIndex: integer().default(0).notNull(),
  // Stores the IDs of questions assigned to this session in order
  assignedQuestionIds: jsonb().default([]).notNull(),
  // Stores answers as [{ questionId, selectedOption, isCorrect }]
  answers: jsonb().default([]).notNull(),
  status: sessionStatusEnum().default("in_progress").notNull(),
  lastMenu: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

// ─── Exam Results ─────────────────────────────────────────────────────────────

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

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  purchases: many(userPurchases),
  results: many(examResults),
  sessions: many(sessionLogs),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  packs: many(examPacks),
  questions: many(questions),
  sessions: many(sessionLogs),
}));

export const examPacksRelations = relations(examPacks, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [examPacks.subjectId],
    references: [subjects.id],
  }),
  questions: many(questions),
  purchases: many(userPurchases),
  sessions: many(sessionLogs),
}));

export const userPurchasesRelations = relations(userPurchases, ({ one }) => ({
  user: one(users, {
    fields: [userPurchases.userId],
    references: [users.id],
  }),
  pack: one(examPacks, {
    fields: [userPurchases.packId],
    references: [examPacks.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  subject: one(subjects, {
    fields: [questions.subjectId],
    references: [subjects.id],
  }),
  pack: one(examPacks, {
    fields: [questions.packId],
    references: [examPacks.id],
  }),
}));

export const sessionLogsRelations = relations(sessionLogs, ({ one }) => ({
  user: one(users, {
    fields: [sessionLogs.userId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [sessionLogs.selectedSubjectId],
    references: [subjects.id],
  }),
  pack: one(examPacks, {
    fields: [sessionLogs.selectedPackId],
    references: [examPacks.id],
  }),
}));

export const examResultsRelations = relations(examResults, ({ one }) => ({
  user: one(users, {
    fields: [examResults.userId],
    references: [users.id],
  }),
  pack: one(examPacks, {
    fields: [examResults.packId],
    references: [examPacks.id],
  }),
}));
