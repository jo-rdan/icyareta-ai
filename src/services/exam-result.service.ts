import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { examResults, questions } from "../db/schema";
import { Answer } from "./session.service";

export type ExamResult = typeof examResults.$inferSelect;

export class ExamResultService {
  /**
   * Saves the final result of a completed quiz session.
   * Called once after the last question is answered.
   */
  async saveResult(
    userId: string,
    packId: string,
    score: number,
    totalQuestions: number,
  ): Promise<ExamResult> {
    const [result] = await db
      .insert(examResults)
      .values({
        userId,
        packId,
        score,
        totalQuestions,
      })
      .returning();

    return result;
  }

  /**
   * Returns all past results for a user, most recent first.
   * Used for the weekly digest SMS and future progress tracking.
   */
  async getResultsByUser(userId: string): Promise<ExamResult[]> {
    return await db
      .select()
      .from(examResults)
      .where(eq(examResults.userId, userId))
      .orderBy(desc(examResults.takenAt));
  }

  /**
   * Looks at the questions the student got wrong and identifies
   * which ones they struggled with.
   *
   * Returns a plain string summary for use in the SMS report.
   * Example: "You got 2 wrong in Fractions and 1 wrong in Geometry."
   *
   * At launch this is basic — just counts wrong answers.
   * Future: tag questions by topic and group by topic name.
   */
  async calculateWeakTopics(answers: Answer[]): Promise<string> {
    const wrongAnswers = answers.filter((a) => !a.isCorrect);

    if (wrongAnswers.length === 0) {
      return "Perfect score! No weak areas identified.";
    }

    if (wrongAnswers.length === answers.length) {
      return "Keep practicing — review all topics before your next session.";
    }

    const wrongCount = wrongAnswers.length;
    const total = answers.length;

    return `You got ${wrongCount} out of ${total} wrong. Dial again to keep practicing.`;
  }

  /**
   * Returns the average score across all sessions for a user.
   * Used in the weekly digest SMS.
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
