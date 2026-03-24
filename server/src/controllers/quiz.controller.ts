import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { UserService } from "../services/user.service";
import { UserPurchaseService } from "../services/user-purchase.service";
import { SessionService } from "../services/session.service";
import { QuestionService } from "../services/question.service";
import { ExamResultService } from "../services/exam-result.service";
import { ExamPackService } from "../services/exam-pack.service";
import { db } from "../db";
import { subjects } from "../db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const userService = new UserService();
const purchaseService = new UserPurchaseService();
const sessionService = new SessionService();
const questionService = new QuestionService();
const resultService = new ExamResultService();
const packService = new ExamPackService();

// Question counts per pack type
const PACK_QUESTION_COUNTS: Record<string, number> = {
  diagnostic: 5,
  daily_drill: 8,
  full_mock: 12,
};

const FREE_TRIAL_COUNT = 5;

/**
 * POST /api/quiz/start
 * Body: { subjectId, packType }
 * Checks access, assigns questions, creates session, returns first question.
 */
export const startQuiz = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId!;
  const { subjectId, packType } = req.body;

  if (!subjectId || !packType) {
    res.status(400).json({ error: "subjectId and packType are required" });
    return;
  }

  const user = await userService.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const activePurchase = await purchaseService.getActivePurchase(userId);
  const isTrial = !activePurchase && !user.hasUsedFreeTrial;

  // Block if trial already used and no active purchase
  if (!activePurchase && user.hasUsedFreeTrial) {
    res
      .status(403)
      .json({ error: "No active access. Please subscribe to continue." });
    return;
  }

  // Find the pack for this subject + type
  const packs = await packService.getPacksBySubjectId(subjectId);
  const pack = packs.find(
    (p) => p.packType === (isTrial ? "diagnostic" : packType),
  );

  if (!pack) {
    res.status(404).json({ error: "Pack not found for this subject" });
    return;
  }

  // Get questions
  const allQuestionIds = await questionService.getQuestionsForSession(
    pack.id,
    pack.packType,
  );
  const count = isTrial
    ? FREE_TRIAL_COUNT
    : (PACK_QUESTION_COUNTS[packType] ?? 5);
  const assignedIds = allQuestionIds.slice(0, count);

  if (assignedIds.length === 0) {
    res.status(404).json({ error: "No questions available for this pack" });
    return;
  }

  // Create session
  const sessionId = uuidv4();
  await sessionService.initializeQuiz(
    userId,
    sessionId,
    subjectId,
    pack.id,
    assignedIds,
  );

  // Mark free trial as used
  if (isTrial) {
    await userService.markTrialUsed(userId);
  }

  // Return first question
  const firstQuestion = await questionService.getQuestionById(assignedIds[0]);

  res.json({
    sessionId,
    isTrial,
    total: assignedIds.length,
    currentIndex: 0,
    question: {
      id: firstQuestion!.id,
      text: firstQuestion!.questionText,
      options: firstQuestion!.options,
    },
  });
};

/**
 * POST /api/quiz/answer
 * Body: { sessionId, selectedOption }
 * Saves answer, returns next question or final score.
 */
export const submitAnswer = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId!;
  const { sessionId, selectedOption } = req.body;

  if (!sessionId || !selectedOption) {
    res
      .status(400)
      .json({ error: "sessionId and selectedOption are required" });
    return;
  }

  if (!["A", "B", "C", "D"].includes(selectedOption)) {
    res.status(400).json({ error: "selectedOption must be A, B, C, or D" });
    return;
  }

  // Get active session for this user
  const session = await sessionService.getActiveSessionForUser(userId);
  if (!session || session.sessionId !== sessionId) {
    res.status(404).json({ error: "Session not found or already completed" });
    return;
  }

  const assignedIds = session.assignedQuestionIds as string[];
  const currentIndex = session.currentQuestionIndex;
  const currentQuestion = await questionService.getQuestionById(
    assignedIds[currentIndex],
  );

  if (!currentQuestion) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  const isCorrect = questionService.evaluateAnswer(
    currentQuestion,
    selectedOption,
  ).isCorrect;

  const existingAnswers =
    (session.answers as Array<{
      questionId: string;
      selectedOption: string;
      isCorrect: boolean;
    }>) ?? [];
  const updatedAnswers = [
    ...existingAnswers,
    { questionId: currentQuestion.id, selectedOption, isCorrect },
  ];

  const nextIndex = currentIndex + 1;
  const isComplete = nextIndex >= assignedIds.length;

  await sessionService.updateSessionProgress(userId, nextIndex, updatedAnswers);

  if (isComplete) {
    // Complete session
    await sessionService.completeSession(userId);

    const score = questionService.calculateScore(updatedAnswers as any);

    // Save result
    await resultService.saveResult(
      userId,
      session.selectedSubjectId!,
      currentQuestion.packId
        ? ((await packService.getPackById(currentQuestion.packId))?.packType ??
            "diagnostic")
        : "diagnostic",
      score.score,
      score.total,
    );

    // Deactivate free trial purchase if applicable
    const purchase = await purchaseService.getActivePurchase(userId);
    if (purchase && purchase.accessType === "free_trial") {
      await purchaseService.deactivatePurchase(purchase.id);
    }

    // Get subject name for response
    const subjectRows = await db
      .select({ name: subjects.name })
      .from(subjects)
      .where(eq(subjects.id, session.selectedSubjectId!))
      .limit(1);

    res.json({
      complete: true,
      answer: {
        selectedOption,
        correctOption: currentQuestion.correctOption,
        isCorrect,
        explanation: currentQuestion.explanation,
      },
      score: {
        correct: score.score,
        total: score.total,
        percentage: score.percentage,
        display: score.display,
      },
      subjectName: subjectRows[0]?.name ?? "Unknown",
    });
    return;
  }

  // Return next question
  const nextQuestion = await questionService.getQuestionById(
    assignedIds[nextIndex],
  );

  res.json({
    complete: false,
    answer: {
      selectedOption,
      correctOption: currentQuestion.correctOption,
      isCorrect,
      explanation: currentQuestion.explanation,
    },
    nextQuestion: {
      id: nextQuestion!.id,
      text: nextQuestion!.questionText,
      options: nextQuestion!.options,
      index: nextIndex,
      total: assignedIds.length,
    },
  });
};

/**
 * GET /api/quiz/session
 * Returns the current active session for the user (for resuming).
 */
export const getSession = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId!;

  const session = await sessionService.getActiveSessionForUser(userId);

  if (!session) {
    res.json({ session: null });
    return;
  }

  const assignedIds = session.assignedQuestionIds as string[];
  const currentIndex = session.currentQuestionIndex;

  if (currentIndex >= assignedIds.length) {
    res.json({ session: null });
    return;
  }

  const currentQuestion = await questionService.getQuestionById(
    assignedIds[currentIndex],
  );

  const subjectRows = await db
    .select({ name: subjects.name })
    .from(subjects)
    .where(eq(subjects.id, session.selectedSubjectId!))
    .limit(1);

  res.json({
    session: {
      sessionId: session.sessionId,
      subjectName: subjectRows[0]?.name ?? "Unknown",
      subjectId: session.selectedSubjectId,
      currentIndex,
      total: assignedIds.length,
      question: currentQuestion
        ? {
            id: currentQuestion.id,
            text: currentQuestion.questionText,
            options: currentQuestion.options,
          }
        : null,
    },
  });
};
