import { eq } from "drizzle-orm";
import { db } from "../db";
import { questions } from "../db/schema";

export type Question = typeof questions.$inferSelect;

export type QuestionOptions = {
  A: string;
  B: string;
  C: string;
  D: string;
};

export type EvaluationResult = {
  isCorrect: boolean;
  correctOption: string;
  explanation: string | null;
};

export class QuestionService {
  /**
   * Returns all question IDs for a pack, shuffled randomly.
   * The controller decides how many to slice — FREE_TRIAL_COUNT or PAID_QUESTION_COUNT.
   */
  async getQuestionsForSession(
    packId: string,
    _packType: string,
  ): Promise<string[]> {
    const allQuestions = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.packId, packId));

    if (allQuestions.length === 0) {
      throw new Error(`No questions found for packId: ${packId}`);
    }

    // Fisher-Yates shuffle
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.map((q) => q.id);
  }

  async getQuestionById(questionId: string): Promise<Question | null> {
    const result = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);
    return result[0] ?? null;
  }

  evaluateAnswer(question: Question, userInput: string): EvaluationResult {
    return {
      isCorrect: userInput === question.correctOption,
      correctOption: question.correctOption,
      explanation: question.explanation ?? null,
    };
  }

  calculateScore(answers: { isCorrect: boolean }[]): {
    score: number;
    total: number;
    percentage: number;
    display: string;
  } {
    const total = answers.length;
    const score = answers.filter((a) => a.isCorrect).length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    return {
      score,
      total,
      percentage,
      display: `${score}/${total} (${percentage}%)`,
    };
  }
}
