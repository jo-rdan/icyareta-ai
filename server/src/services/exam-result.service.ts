import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { examResults } from "../db/schema";
import { Answer } from "./session.service";

export type ExamResult = typeof examResults.$inferSelect;

export class ExamResultService {
  /**
   * Saves the final result of a completed quiz session.
   * Now stores subjectId + packType directly since purchases
   * are no longer tied to specific packs.
   */
  async saveResult(
    userId: string,
    subjectId: string,
    packType: string,
    score: number,
    totalQuestions: number,
  ): Promise<ExamResult> {
    const [result] = await db
      .insert(examResults)
      .values({
        userId,
        subjectId,
        packType: packType as any,
        score,
        totalQuestions,
      })
      .returning();

    return result;
  }

  /**
   * Returns all past results for a user, most recent first.
   */
  async getResultsByUser(userId: string): Promise<ExamResult[]> {
    return await db
      .select()
      .from(examResults)
      .where(eq(examResults.userId, userId))
      .orderBy(desc(examResults.takenAt));
  }

  /**
   * Returns a plain string summary of weak areas for SMS.
   */
  async calculateWeakTopics(answers: Answer[]): Promise<string> {
    const wrongAnswers = answers.filter((a) => !a.isCorrect);

    if (wrongAnswers.length === 0) {
      return "Perfect score! No weak areas identified.";
    }

    const wrongCount = wrongAnswers.length;
    const total = answers.length;

    return `You got ${wrongCount} out of ${total} wrong. Dial again to keep practicing.`;
  }

  /**
   * Returns the average score percentage across all sessions for a user.
   */
  async getAverageScore(userId: string): Promise<number> {
    const results = await this.getResultsByUser(userId);
    if (results.length === 0) return 0;

    const total = results.reduce((sum, r) => {
      return sum + Math.round((r.score / r.totalQuestions) * 100);
    }, 0);

    return Math.round(total / results.length);
  }
}
