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

const FREE_TRIAL_COUNT = 5;
const PAID_QUESTION_COUNT = 12;

/**
 * POST /api/quiz/start
 * Body: { subjectId, packType }
 *
 * packType from the frontend is ignored for pack lookup — we always use
 * whichever pack exists for the subject (always "full_mock" after the
 * ingest rewrite). packType is kept in the body for backwards compatibility.
 */
export const startQuiz = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId!;
  const { subjectId } = req.body;

  if (!subjectId) {
    res.status(400).json({ error: "subjectId is required" });
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
    res.status(403).json({
      error: "No active access. Please subscribe to continue.",
    });
    return;
  }

  // Get the pack for this subject — just take the first one found.
  // Since the ingest script now creates a single "full_mock" pack per
  // subject, this will always be that pack. If multiple packs somehow
  // exist, the first one is fine.
  const packs = await packService.getPacksBySubjectId(subjectId);
  if (packs.length === 0) {
    res.status(404).json({
      error:
        "No question pack found for this subject. Run the ingest script first.",
    });
    return;
  }
  const pack = packs[0];

  // Fetch and shuffle all questions for this pack, then slice to count
  const allQuestionIds = await questionService.getQuestionsForSession(
    pack.id,
    pack.packType,
  );

  const count = isTrial ? FREE_TRIAL_COUNT : PAID_QUESTION_COUNT;
  const assignedIds = allQuestionIds.slice(0, count);

  if (assignedIds.length === 0) {
    res.status(404).json({ error: "No questions available for this subject." });
    return;
  }

  // Initialise session (abandons any existing in_progress session first)
  const sessionId = uuidv4();
  await sessionService.initializeQuiz(
    userId,
    sessionId,
    subjectId,
    pack.id,
    assignedIds,
  );

  // Mark free trial as used immediately so a refresh can't start a second trial
  if (isTrial) {
    await userService.markTrialUsed(userId);
  }

  const firstQuestion = await questionService.getQuestionById(assignedIds[0]);
  if (!firstQuestion) {
    res.status(500).json({ error: "Failed to load first question." });
    return;
  }

  res.json({
    sessionId,
    isTrial,
    total: assignedIds.length,
    currentIndex: 0,
    question: {
      id: firstQuestion.id,
      text: firstQuestion.questionText,
      options: firstQuestion.options,
      correctOption: firstQuestion.correctOption,
    },
  });
};

/**
 * POST /api/quiz/answer
 * Body: { sessionId, selectedOption }
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

  const { isCorrect } = questionService.evaluateAnswer(
    currentQuestion,
    selectedOption,
  );

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
    await sessionService.completeSession(userId);

    const score = questionService.calculateScore(updatedAnswers);

    // Determine packType for the result record
    const pack = await packService.getPackById(currentQuestion.packId);
    const packType = pack?.packType ?? "full_mock";

    await resultService.saveResult(
      userId,
      session.selectedSubjectId!,
      packType,
      score.score,
      score.total,
    );

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
      correctOption: nextQuestion!.correctOption,
      index: nextIndex,
      total: assignedIds.length,
    },
  });
};

/**
 * GET /api/quiz/session
 * Returns the current active session (for resuming after a page refresh).
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
