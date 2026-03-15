import { UserService } from "./user.service";
import { SubjectService } from "./subject.service";
import { ExamPackService } from "./exam-pack.service";
import { UserPurchaseService } from "./user-purchase.service";
import { SessionService, Answer } from "./session.service";
import { QuestionService } from "./question.service";
import { SmsService } from "./sms.service";
import { ExamResultService } from "./exam-result.service";
import { db } from "../db";
import { examPacks } from "../db/schema";
import { eq } from "drizzle-orm";

const userService = new UserService();
const subjectService = new SubjectService();
const examPackService = new ExamPackService();
const userPurchaseService = new UserPurchaseService();
const sessionService = new SessionService();
const questionService = new QuestionService();
const smsService = new SmsService();
const examResultService = new ExamResultService();

// Number of questions per pack type — must match QuestionService
const PACK_QUESTION_COUNTS: Record<string, number> = {
  diagnostic: 3,
  daily_drill: 5,
  full_mock: 8,
};

// Bundle prices
const BUNDLE_PRICES: Record<string, number> = {
  diagnostic: 2500,
  daily_drill: 4500,
  full_mock: 9000,
};

export class UssdNavigationService {
  static async processInput(
    sessionId: string,
    phoneNumber: string,
    text: string,
  ): Promise<string> {
    try {
      // ── 1. Identify or create the user ──────────────────────────────────
      const user = await userService.findOrCreateUserByPhoneNumber(phoneNumber);

      // ── 2. Parse input ───────────────────────────────────────────────────
      const steps = text === "" ? [] : text.split("*");

      // ── 3. Check for active in_progress session (checkpoint resume) ──────
      // This runs on EVERY dial-in before any menu logic.
      // If the user timed out mid-quiz, we resume them instantly.
      const activeSession = await sessionService.getActiveSessionForUser(
        user.id,
      );

      if (
        activeSession &&
        activeSession.lastMenu === "quiz" &&
        steps.length === 0
      ) {
        // User re-dialled — resume their quiz
        const assignedIds = activeSession.assignedQuestionIds as string[];
        const currentIndex = activeSession.currentQuestionIndex;
        const total = assignedIds.length;

        if (currentIndex >= total) {
          // Edge case: session marked quiz but all questions answered — show score
          return await this.showScore(activeSession, user.id, phoneNumber);
        }

        const question = await questionService.getQuestionById(
          assignedIds[currentIndex],
        );
        if (!question) {
          await sessionService.abandonSession(user.id);
          return "END Something went wrong. Please dial again.";
        }

        return `CON Resuming your quiz...\n${questionService.formatQuestionForUssd(question, currentIndex, total)}`;
      }

      // ── 4. Handle Exit (0 at any point) ─────────────────────────────────
      if (steps.length > 0 && steps[steps.length - 1] === "00") {
        await sessionService.abandonSession(user.id);
        return "END Thank you for using Icyareta. Good luck with your exams!";
      }

      // ── 5. Welcome screen ────────────────────────────────────────────────
      if (steps.length === 0) {
        const subjects = await subjectService.getAllSubjects();
        let menu = "CON Welcome to Icyareta!\nChoose a subject:\n";
        subjects.forEach((s, i) => {
          menu += `${i + 1}. ${s.name}\n`;
        });
        menu += "0. All Subjects Bundle\n";
        menu += "00. Exit";
        return menu;
      }

      // ── 6. Subject or Bundle selected ────────────────────────────────────
      if (steps.length === 1) {
        const subjects = await subjectService.getAllSubjects();

        // Bundle path
        if (steps[0] === "0") {
          return (
            "CON Choose Bundle:\n" +
            "1. Bronze - 2,500 RWF (3 Qs/subject)\n" +
            "2. Silver - 4,500 RWF (5 Qs/subject)\n" +
            "3. Gold   - 9,000 RWF (8 Qs/subject)\n" +
            "00. Exit"
          );
        }

        const subjectIndex = parseInt(steps[0]) - 1;
        if (
          isNaN(subjectIndex) ||
          subjectIndex < 0 ||
          subjectIndex >= subjects.length
        ) {
          return "CON Invalid choice. Please try again.\n1. English Language\n2. Mathematics\n3. Science & Technology\n4. Social & Religious Studies\n0. All Subjects Bundle";
        }

        return (
          "CON Choose Pack:\n" +
          "1. Bronze -   500 RWF (3 questions)\n" +
          "2. Silver - 1,000 RWF (5 questions)\n" +
          "3. Gold   - 2,000 RWF (8 questions)\n" +
          "00. Exit"
        );
      }

      // ── 7. Pack selected ─────────────────────────────────────────────────
      if (steps.length === 2) {
        const packTypes = ["diagnostic", "daily_drill", "full_mock"];
        const isBundle = steps[0] === "0";
        const packIndex = parseInt(steps[1]) - 1;

        if (isNaN(packIndex) || packIndex < 0 || packIndex > 2) {
          return (
            "CON Invalid choice.\n" + "1. Bronze\n2. Silver\n3. Gold\n00. Exit"
          );
        }

        const selectedPackType = packTypes[packIndex];

        if (isBundle) {
          const price = BUNDLE_PRICES[selectedPackType];
          const packLabel = ["Bronze", "Silver", "Gold"][packIndex];
          return (
            `CON Confirm Payment:\n` +
            `Bundle ${packLabel} - ${price.toLocaleString()} RWF\n` +
            `All 4 subjects included\n` +
            `Pay via MoMo?\n` +
            `1. Confirm\n` +
            `2. Cancel`
          );
        }

        // Single subject
        const subjects = await subjectService.getAllSubjects();
        const subjectIndex = parseInt(steps[0]) - 1;
        const subject = subjects[subjectIndex];
        const prices = [500, 1000, 2000];
        const packLabel = ["Bronze", "Silver", "Gold"][packIndex];

        return (
          `CON Confirm Payment:\n` +
          `${subject.name}\n` +
          `${packLabel} - ${prices[packIndex].toLocaleString()} RWF\n` +
          `Pay via MoMo?\n` +
          `1. Confirm\n` +
          `2. Cancel`
        );
      }

      // ── 8. Payment confirmation ───────────────────────────────────────────
      if (steps.length === 3) {
        const confirmation = steps[2];

        if (confirmation === "2") {
          return "END Payment cancelled. Dial again when ready.";
        }

        if (confirmation !== "1") {
          return "CON Invalid choice.\n1. Confirm\n2. Cancel";
        }

        // User confirmed payment
        const packTypes = ["diagnostic", "daily_drill", "full_mock"];
        const isBundle = steps[0] === "0";
        const packIndex = parseInt(steps[1]) - 1;
        const selectedPackType = packTypes[packIndex];

        // ── PAYMENT PLACEHOLDER ──────────────────────────────────────────
        // MoMo API integration goes here when production keys are ready.
        // For now we create the purchase record directly to unblock testing.
        // ────────────────────────────────────────────────────────────────
        const transactionReference = `ICY-TEST-${Date.now()}`;

        if (isBundle) {
          // Find all packs for this pack type and create one purchase per subject
          const allPacks = await db
            .select()
            .from(examPacks)
            .where(eq(examPacks.packType, selectedPackType as any));

          const bundlePrice = BUNDLE_PRICES[selectedPackType];

          for (const pack of allPacks) {
            await userPurchaseService.createPurchase(
              user.id,
              pack.id,
              transactionReference,
              true,
              bundlePrice,
            );
          }
        } else {
          const subjects = await subjectService.getAllSubjects();
          const subjectIndex = parseInt(steps[0]) - 1;
          const subject = subjects[subjectIndex];
          const packs = await examPackService.getPacksBySubjectId(subject.id);
          const selectedPack = packs.find(
            (p) => p.packType === selectedPackType,
          );

          if (!selectedPack) {
            return "END Something went wrong. Please dial again.";
          }

          await userPurchaseService.createPurchase(
            user.id,
            selectedPack.id,
            transactionReference,
            false,
            null,
          );
        }

        // Update session to track what was purchased
        await sessionService.updateLastMenu(user.id, "paid");

        // Send payment confirmation SMS
        const packLabels = ["Bronze", "Silver", "Gold"];
        const packLabel = packLabels[packIndex];
        const prices = [500, 1000, 2000];
        const bundlePrices = [2500, 4500, 9000];
        const amountPaid = isBundle
          ? bundlePrices[packIndex]
          : prices[packIndex];
        const subjectLabel = isBundle
          ? "All Subjects Bundle"
          : ((await subjectService.getAllSubjects())[parseInt(steps[0]) - 1]
              ?.name ?? "");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Fire and forget — don't await, don't block the USSD response
        smsService.sendPaymentConfirmation(
          phoneNumber,
          packLabel,
          subjectLabel,
          amountPaid,
          expiresAt,
        );

        return (
          "END Payment received! Dial again to start your quiz.\n" +
          "Your session is valid for 24 hours."
        );
      }

      // ── 9. Quiz flow ─────────────────────────────────────────────────────
      // At this point the user has paid and re-dialled.
      // steps.length === 1 but activeSession.lastMenu === "paid"
      // We need to handle the quiz start and answer flow here.

      if (
        activeSession &&
        activeSession.lastMenu === "paid" &&
        steps.length === 1
      ) {
        // Bundle users need to pick which subject to start with
        if (steps[0] === "0") {
          const subjects = await subjectService.getAllSubjects();
          let menu = "CON Choose subject to start:\n";
          subjects.forEach((s, i) => {
            menu += `${i + 1}. ${s.name}\n`;
          });
          return menu;
        }
      }

      // ── 10. Answer processing ─────────────────────────────────────────────
      if (
        activeSession &&
        activeSession.lastMenu === "quiz" &&
        steps.length >= 1
      ) {
        const assignedIds = activeSession.assignedQuestionIds as string[];
        const currentIndex = activeSession.currentQuestionIndex;
        const total = assignedIds.length;
        const userInput = steps[steps.length - 1];

        // Get the current question
        const question = await questionService.getQuestionById(
          assignedIds[currentIndex],
        );

        if (!question) {
          await sessionService.abandonSession(user.id);
          return "END Something went wrong. Please dial again.";
        }

        // Evaluate the answer
        const evaluation = questionService.evaluateAnswer(question, userInput);

        if (!["1", "2", "3", "4"].includes(userInput)) {
          return `CON Invalid choice. Please select 1, 2, 3 or 4.\n${questionService.formatQuestionForUssd(question, currentIndex, total)}`;
        }

        // Save the answer
        const existingAnswers = (activeSession.answers as Answer[]) || [];
        const updatedAnswers: Answer[] = [
          ...existingAnswers,
          {
            questionId: question.id,
            selectedOption: userInput,
            isCorrect: evaluation.isCorrect,
          },
        ];

        const nextIndex = currentIndex + 1;

        // Checkpoint — save progress before anything else
        await sessionService.updateSessionProgress(
          user.id,
          nextIndex,
          updatedAnswers,
        );

        // Last question answered — show score
        if (nextIndex >= total) {
          return await this.showScore(
            { ...activeSession, answers: updatedAnswers },
            user.id,
            phoneNumber,
          );
        }

        // Show next question
        const nextQuestion = await questionService.getQuestionById(
          assignedIds[nextIndex],
        );

        if (!nextQuestion) {
          await sessionService.abandonSession(user.id);
          return "END Something went wrong. Please dial again.";
        }

        return `CON ${questionService.formatQuestionForUssd(nextQuestion, nextIndex, total)}`;
      }

      // ── 11. Start quiz after payment confirmed ────────────────────────────
      if (
        activeSession &&
        activeSession.lastMenu === "paid" &&
        steps.length === 0
      ) {
        // Check if this is a bundle — show subject picker
        const purchases = await db
          .select()
          .from(examPacks)
          .where(eq(examPacks.id, activeSession.selectedPackId ?? ""));

        const subjects = await subjectService.getAllSubjects();
        let menu = "CON Choose subject to start:\n";
        subjects.forEach((s, i) => {
          menu += `${i + 1}. ${s.name}\n`;
        });
        return menu;
      }

      // Fallback
      return "END Invalid input. Please dial again.";
    } catch (error) {
      console.error("USSD Navigation Error:", error);
      return "END An error occurred. Please try again.";
    }
  }

  // ── Helper: Start quiz for a subject + pack ────────────────────────────────
  static async startQuiz(
    userId: string,
    sessionId: string,
    subjectId: string,
    packId: string,
    packType: string,
  ): Promise<string> {
    const assignedQuestionIds = await questionService.getQuestionsForSession(
      packId,
      packType,
    );

    await sessionService.initializeQuiz(
      userId,
      sessionId,
      subjectId,
      packId,
      assignedQuestionIds,
    );

    const total = assignedQuestionIds.length;
    const firstQuestion = await questionService.getQuestionById(
      assignedQuestionIds[0],
    );

    if (!firstQuestion) {
      return "END No questions available. Please try again.";
    }

    return `CON ${questionService.formatQuestionForUssd(firstQuestion, 0, total)}`;
  }

  // ── Helper: Show final score screen ────────────────────────────────────────
  private static async showScore(
    session: {
      answers: unknown;
      selectedPackId?: string | null;
      selectedSubjectId?: string | null;
    },
    userId: string,
    phoneNumber: string,
  ): Promise<string> {
    const answers = (session.answers as Answer[]) || [];
    const result = questionService.calculateScore(answers);

    // Complete the session
    await sessionService.completeSession(userId);

    // Save the result to DB
    if (session.selectedPackId) {
      await examResultService.saveResult(
        userId,
        session.selectedPackId,
        result.score,
        result.total,
      );
    }

    // Resolve subject and pack names for SMS
    let subjectName = "your subject";
    let packLabel = "this pack";
    let packType = "diagnostic";

    if (session.selectedSubjectId) {
      const subject = await subjectService.getSubjectById(
        session.selectedSubjectId,
      );
      if (subject) subjectName = subject.name;
    }

    if (session.selectedPackId) {
      const pack = await examPackService.getPackById(session.selectedPackId);
      if (pack) {
        packType = pack.packType;
        packLabel =
          pack.packType === "diagnostic"
            ? "Bronze"
            : pack.packType === "daily_drill"
              ? "Silver"
              : "Gold";
      }
    }

    // Send performance report SMS — fire and forget
    smsService.sendPerformanceReport(
      phoneNumber,
      subjectName,
      packLabel,
      result.score,
      result.total,
      result.percentage,
    );

    // Send upsell SMS 5 minutes later if score is below 60%
    if (result.percentage < 60) {
      const packOrder = ["diagnostic", "daily_drill", "full_mock"];
      const nextPackIndex = packOrder.indexOf(packType) + 1;

      if (nextPackIndex < packOrder.length) {
        const nextPackLabels = ["Bronze", "Silver", "Gold"];
        const nextPackPrices = [500, 1000, 2000];
        const nextLabel = nextPackLabels[nextPackIndex];
        const nextPrice = nextPackPrices[nextPackIndex];

        setTimeout(
          () => {
            smsService.sendUpsellMessage(
              phoneNumber,
              subjectName,
              packLabel,
              nextLabel,
              nextPrice,
            );
          },
          5 * 60 * 1000,
        ); // 5 minutes
      }
    }

    const message =
      result.percentage >= 60
        ? "Great work! Keep it up!"
        : "Keep practicing! You can do better.";

    return (
      `END Your Score: ${result.display}\n` +
      `${message}\n` +
      `Dial again to practice another subject.`
    );
  }
}
