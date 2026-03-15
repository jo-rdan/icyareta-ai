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

// Maps the number the user presses on USSD to the option letter
const INPUT_TO_OPTION: Record<string, string> = {
  "1": "A",
  "2": "B",
  "3": "C",
  "4": "D",
};

// How many questions per pack type — locked in product decision
const QUESTIONS_PER_PACK: Record<string, number> = {
  diagnostic: 3,
  daily_drill: 5,
  full_mock: 8,
};

export class QuestionService {
  /**
   * Selects a random set of questions for a session from a given pack.
   * Called once when the quiz starts, after payment is confirmed.
   *
   * Returns the question IDs in randomised order — these are stored
   * in session_logs.assignedQuestionIds so the same questions are
   * served consistently even across timeouts and resumes.
   */
  async getQuestionsForSession(
    packId: string,
    packType: string,
  ): Promise<string[]> {
    const allQuestions = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.packId, packId));

    if (allQuestions.length === 0) {
      throw new Error(`No questions found for packId: ${packId}`);
    }

    // Shuffle using Fisher-Yates algorithm
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);

    // Use pack type to determine how many questions to serve
    const count =
      QUESTIONS_PER_PACK[packType] ?? QUESTIONS_PER_PACK["diagnostic"];

    return shuffled.slice(0, count).map((q) => q.id);
  }

  /**
   * Fetches a specific question by its ID.
   * Used to display the question at a given index during the quiz.
   */
  async getQuestionById(questionId: string): Promise<Question | null> {
    const result = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Returns the correct number of questions for a given pack type.
   * Used when initialising a quiz session.
   */
  getQuestionCountForPackType(packType: string): number {
    return QUESTIONS_PER_PACK[packType] ?? QUESTIONS_PER_PACK["diagnostic"];
  }

  /**
   * Formats a question for display on a USSD screen.
   * Keeps within the 182 character USSD response limit.
   *
   * Format:
   * Q{n}/{total}: {question text}
   * 1. {Option A}
   * 2. {Option B}
   * 3. {Option C}
   * 4. {Option D}
   */
  formatQuestionForUssd(
    question: Question,
    currentIndex: number,
    total: number,
  ): string {
    const options = question.options as QuestionOptions;
    return (
      `Q${currentIndex + 1}/${total}: ${question.questionText}\n` +
      `1. ${options.A}\n` +
      `2. ${options.B}\n` +
      `3. ${options.C}\n` +
      `4. ${options.D}`
    );
  }

  /**
   * Evaluates the user's answer.
   * The user presses 1/2/3/4 on their phone — we map that to A/B/C/D
   * and compare against the stored correct option.
   */
  evaluateAnswer(question: Question, userInput: string): EvaluationResult {
    const selectedOption = INPUT_TO_OPTION[userInput];

    if (!selectedOption) {
      return {
        isCorrect: false,
        correctOption: question.correctOption,
        explanation: question.explanation ?? null,
      };
    }

    return {
      isCorrect: selectedOption === question.correctOption,
      correctOption: question.correctOption,
      explanation: question.explanation ?? null,
    };
  }

  /**
   * Calculates the final score from the answers array stored in session_logs.
   * Returns score as a number and percentage string e.g. "2/3 (67%)"
   */
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
