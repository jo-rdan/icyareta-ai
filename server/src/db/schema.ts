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

// free_trial = 1 hour, 5 questions, 0 RWF
// day_pass   = 24 hours, all subjects, 800 RWF
// week_pass  = 7 days,  all subjects, 5,000 RWF
// month_pass = 30 days, all subjects, 9,000 RWF
export const accessTypeEnum = pgEnum("access_type", [
  "free_trial",
  "day_pass",
  "week_pass",
  "month_pass",
]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  phoneNumber: text().notNull().unique(),
  email: text().unique(),
  childName: text(),
  hasUsedFreeTrial: boolean().default(false).notNull(),
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

export const userPurchases = pgTable("user_purchases", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .references(() => users.id)
    .notNull(),
  accessType: accessTypeEnum().notNull(),
  amountPaid: integer().notNull().default(0),
  transactionReference: text(),
  isActive: boolean().default(true).notNull(),
  purchasedAt: timestamp().defaultNow().notNull(),
  expiresAt: timestamp().notNull(),
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
  options: jsonb().notNull(),
  correctOption: text().notNull(),
  explanation: text(),
  year: integer().notNull(),
});

// ─── Session Logs ─────────────────────────────────────────────────────────────

export const sessionLogs = pgTable("session_logs", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .references(() => users.id)
    .notNull(),
  sessionId: text().notNull().unique(),
  selectedSubjectId: uuid().references(() => subjects.id),
  selectedPackId: uuid().references(() => examPacks.id),
  currentQuestionIndex: integer().default(0).notNull(),
  assignedQuestionIds: jsonb().default([]).notNull(),
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
  subjectId: uuid()
    .references(() => subjects.id)
    .notNull(),
  packType: packTypeEnum().notNull(),
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
  results: many(examResults),
}));

export const examPacksRelations = relations(examPacks, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [examPacks.subjectId],
    references: [subjects.id],
  }),
  questions: many(questions),
  sessions: many(sessionLogs),
}));

export const userPurchasesRelations = relations(userPurchases, ({ one }) => ({
  user: one(users, { fields: [userPurchases.userId], references: [users.id] }),
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
  user: one(users, { fields: [sessionLogs.userId], references: [users.id] }),
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
  user: one(users, { fields: [examResults.userId], references: [users.id] }),
  subject: one(subjects, {
    fields: [examResults.subjectId],
    references: [subjects.id],
  }),
}));
