import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { sessionLogs } from "../db/schema";

export type SessionLog = typeof sessionLogs.$inferSelect;

export type Answer = {
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
};

export class SessionService {
  /**
   * Called on every single dial-in, before any menu logic.
   *
   * Checks if this user has an in_progress session (i.e. they were
   * mid-quiz and timed out). If yes, returns that session so the
   * navigation service can resume exactly where they stopped.
   *
   * If no active session exists, creates a fresh one using the
   * AT-provided sessionId.
   *
   * IMPORTANT: We match on userId, NOT sessionId, because Africa's
   * Talking generates a brand new sessionId on every dial-in — even
   * if the user is resuming an interrupted quiz.
   */
  async findOrCreateSession(
    userId: string,
    sessionId: string,
  ): Promise<SessionLog> {
    const existing = await db
      .select()
      .from(sessionLogs)
      .where(
        and(
          eq(sessionLogs.userId, userId),
          eq(sessionLogs.status, "in_progress"),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [newSession] = await db
      .insert(sessionLogs)
      .values({
        userId,
        sessionId,
        status: "in_progress",
        lastMenu: "welcome",
        currentQuestionIndex: 0,
        assignedQuestionIds: [],
        answers: [],
      })
      .returning();

    return newSession;
  }

  /**
   * Looks up a session by the AT sessionId.
   * Used when we need to read the current state mid-flow.
   */
  async getSessionBySessionId(sessionId: string): Promise<SessionLog | null> {
    const result = await db
      .select()
      .from(sessionLogs)
      .where(eq(sessionLogs.sessionId, sessionId))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Returns any in_progress session for a user.
   * Used to detect whether a returning user needs to resume.
   */
  async getActiveSessionForUser(userId: string): Promise<SessionLog | null> {
    const result = await db
      .select()
      .from(sessionLogs)
      .where(
        and(
          eq(sessionLogs.userId, userId),
          eq(sessionLogs.status, "in_progress"),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Called once after payment is confirmed and questions have been selected.
   * Locks in the subject, pack, and the exact question IDs for this session.
   * Also updates the sessionId to the current AT sessionId.
   *
   * After this point, every answer the user gives is checkpointed via
   * updateSessionProgress() — so a timeout never loses their progress.
   */
  async initializeQuiz(
    userId: string,
    sessionId: string,
    selectedSubjectId: string,
    selectedPackId: string,
    assignedQuestionIds: string[],
  ): Promise<void> {
    // First abandon any existing in_progress session for this user
    // so we never have two active sessions at once
    await db
      .update(sessionLogs)
      .set({ status: "abandoned", lastMenu: "exit", updatedAt: new Date() })
      .where(
        and(
          eq(sessionLogs.userId, userId),
          eq(sessionLogs.status, "in_progress"),
        ),
      );

    // Insert a fresh session row — used by both PWA and USSD flows
    await db.insert(sessionLogs).values({
      userId,
      sessionId,
      selectedSubjectId,
      selectedPackId,
      assignedQuestionIds,
      currentQuestionIndex: 0,
      answers: [],
      status: "in_progress",
      lastMenu: "quiz",
    });
  }

  /**
   * Saves the user's latest answer and advances the question index.
   * Called after EVERY answer — this is the checkpoint write.
   *
   * If the session times out immediately after this call, the user
   * will resume at the correct question on their next dial-in.
   */
  async updateSessionProgress(
    userId: string,
    newIndex: number,
    answers: Answer[],
  ): Promise<void> {
    await db
      .update(sessionLogs)
      .set({
        currentQuestionIndex: newIndex,
        answers,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sessionLogs.userId, userId),
          eq(sessionLogs.status, "in_progress"),
        ),
      );
  }

  /**
   * Updates the lastMenu field so we know where the user is
   * in the navigation flow at any point in time.
   */
  async updateLastMenu(userId: string, menu: string): Promise<void> {
    await db
      .update(sessionLogs)
      .set({ lastMenu: menu, updatedAt: new Date() })
      .where(
        and(
          eq(sessionLogs.userId, userId),
          eq(sessionLogs.status, "in_progress"),
        ),
      );
  }

  /**
   * Marks the session as completed after the final question.
   * Once completed, findOrCreateSession() will create a fresh session
   * on the next dial-in instead of resuming this one.
   */
  async completeSession(userId: string): Promise<void> {
    await db
      .update(sessionLogs)
      .set({
        status: "completed",
        lastMenu: "score",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sessionLogs.userId, userId),
          eq(sessionLogs.status, "in_progress"),
        ),
      );
  }

  /**
   * Marks the session as abandoned when the user explicitly exits.
   * Same effect as completeSession() — clears the in_progress state
   * so the next dial-in starts fresh.
   */
  async abandonSession(userId: string): Promise<void> {
    await db
      .update(sessionLogs)
      .set({
        status: "abandoned",
        lastMenu: "exit",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sessionLogs.userId, userId),
          eq(sessionLogs.status, "in_progress"),
        ),
      );
  }
}
