// import { UserService } from "./user.service";
// import { SubjectService } from "./subject.service";
// import { ExamPackService } from "./exam-pack.service";
// import {
//   UserPurchaseService,
//   AccessType,
//   ACCESS_PRICES,
// } from "./user-purchase.service";
// import { SessionService, Answer } from "./session.service";
// import { QuestionService } from "./question.service";
// import { SmsService } from "./sms.service";
// import { ExamResultService } from "./exam-result.service";
// import { db } from "../db";
// import { examPacks } from "../db/schema";
// import { eq, and } from "drizzle-orm";

// const userService = new UserService();
// const subjectService = new SubjectService();
// const examPackService = new ExamPackService();
// const userPurchaseService = new UserPurchaseService();
// const sessionService = new SessionService();
// const questionService = new QuestionService();
// const smsService = new SmsService();
// const examResultService = new ExamResultService();

// // Free trial always uses Bronze (diagnostic) questions — 3 questions
// const FREE_TRIAL_PACK_TYPE = "diagnostic";
// const FREE_TRIAL_QUESTION_COUNT = 3;

// // For paid access, which pack type to serve based on user's choice
// // Users pick a subject then a difficulty level during the quiz
// const PACK_TYPE_LABELS: Record<string, string> = {
//   diagnostic: "Bronze (Recall)",
//   daily_drill: "Silver (Practice)",
//   full_mock: "Gold (Mock Exam)",
// };

// export class UssdNavigationService {
//   static async processInput(
//     sessionId: string,
//     phoneNumber: string,
//     text: string,
//   ): Promise<string> {
//     try {
//       // ── 1. Identify or create the user ──────────────────────────────────
//       const user = await userService.findOrCreateUserByPhoneNumber(phoneNumber);
//       const steps = text === "" ? [] : text.split("*");

//       // ── 2. Check for active in_progress session (checkpoint resume) ──────
//       const activeSession = await sessionService.getActiveSessionForUser(
//         user.id,
//       );

//       if (
//         activeSession &&
//         activeSession.lastMenu === "quiz" &&
//         steps.length === 0
//       ) {
//         const assignedIds = activeSession.assignedQuestionIds as string[];
//         const currentIndex = activeSession.currentQuestionIndex;
//         const total = assignedIds.length;

//         if (currentIndex >= total) {
//           return await this.showScore(activeSession, user.id, phoneNumber);
//         }

//         const question = await questionService.getQuestionById(
//           assignedIds[currentIndex],
//         );
//         if (!question) {
//           await sessionService.abandonSession(user.id);
//           return "END Something went wrong. Please dial again.";
//         }

//         return `CON Resuming your quiz...\n${questionService.formatQuestionForUssd(question, currentIndex, total)}`;
//       }

//       // ── 3. Handle Exit ───────────────────────────────────────────────────
//       if (steps.length > 0 && steps[steps.length - 1] === "00") {
//         await sessionService.abandonSession(user.id);
//         return "END Thank you for using Icyareta!\nGood luck with your exams.";
//       }

//       // ── 4. Answer processing (mid-quiz) ───────────────────────────────────
//       if (
//         activeSession &&
//         activeSession.lastMenu === "quiz" &&
//         steps.length >= 1
//       ) {
//         return await this.processAnswer(
//           activeSession,
//           user.id,
//           phoneNumber,
//           steps,
//         );
//       }

//       // ── 5. Welcome screen ────────────────────────────────────────────────
//       if (steps.length === 0) {
//         // New user who has never used the free trial
//         if (!user.hasUsedFreeTrial) {
//           return (
//             "CON Welcome to Icyareta!\n" +
//             "P6 exam prep on any phone.\n" +
//             "You have 1 FREE session!\n" +
//             "Choose a subject:\n" +
//             (await this.buildSubjectMenu())
//           );
//         }

//         // Returning user — check if they have active paid access
//         const activePurchase = await userPurchaseService.getActivePurchase(
//           user.id,
//         );

//         if (activePurchase) {
//           // Has active access — go straight to subject picker
//           const expiryHours = Math.ceil(
//             (activePurchase.expiresAt.getTime() - Date.now()) /
//               (1000 * 60 * 60),
//           );
//           return (
//             "CON Welcome back!\n" +
//             `Access valid for ${expiryHours}h\n` +
//             "Choose a subject:\n" +
//             (await this.buildSubjectMenu())
//           );
//         }

//         // No active access — show payment options
//         return this.buildPaymentMenu();
//       }

//       // ── 6. Free trial flow ────────────────────────────────────────────────
//       if (!user.hasUsedFreeTrial && steps.length === 1) {
//         return await this.handleFreeTrialSubjectSelection(
//           user.id,
//           sessionId,
//           steps[0],
//         );
//       }

//       // ── 7. Paid access — subject selection ───────────────────────────────
//       const activePurchase = await userPurchaseService.getActivePurchase(
//         user.id,
//       );

//       if (activePurchase && steps.length === 1) {
//         return await this.handleSubjectSelection(user.id, sessionId, steps[0]);
//       }

//       // ── 8. Paid access — difficulty selection ────────────────────────────
//       if (activePurchase && steps.length === 2) {
//         return await this.handleDifficultySelection(
//           user.id,
//           sessionId,
//           steps[0],
//           steps[1],
//         );
//       }

//       // ── 9. Payment flow ───────────────────────────────────────────────────
//       if (!activePurchase && steps.length === 1) {
//         return await this.handlePaymentSelection(user.id, steps[0]);
//       }

//       // ── 10. Payment confirmation ──────────────────────────────────────────
//       if (!activePurchase && steps.length === 2) {
//         return await this.handlePaymentConfirmation(
//           user.id,
//           phoneNumber,
//           steps[0],
//           steps[1],
//         );
//       }

//       // ── 11. Post-payment subject selection ───────────────────────────────
//       if (
//         activeSession &&
//         activeSession.lastMenu === "paid" &&
//         steps.length === 0
//       ) {
//         return (
//           "CON Payment confirmed!\n" +
//           "Choose a subject to start:\n" +
//           (await this.buildSubjectMenu())
//         );
//       }

//       return "END Invalid input. Please dial again.";
//     } catch (error) {
//       console.error("USSD Navigation Error:", error);
//       return "END An error occurred. Please try again.";
//     }
//   }

//   // ── Free trial: subject selected → start quiz immediately ────────────────
//   private static async handleFreeTrialSubjectSelection(
//     userId: string,
//     sessionId: string,
//     subjectInput: string,
//   ): Promise<string> {
//     const subjects = await subjectService.getAllSubjects();
//     const subjectIndex = parseInt(subjectInput) - 1;

//     if (
//       isNaN(subjectIndex) ||
//       subjectIndex < 0 ||
//       subjectIndex >= subjects.length
//     ) {
//       return (
//         "CON Invalid choice. Choose a subject:\n" +
//         (await this.buildSubjectMenu())
//       );
//     }

//     const subject = subjects[subjectIndex];

//     // Create free trial purchase record
//     await userPurchaseService.createPurchase(userId, "free_trial", null);

//     // Find the diagnostic pack for this subject
//     const packs = await examPackService.getPacksBySubjectId(subject.id);
//     const diagnosticPack = packs.find((p) => p.packType === "diagnostic");

//     if (!diagnosticPack) {
//       return "END No questions available. Please try again.";
//     }

//     // Start quiz with 3 Bronze questions
//     return await this.startQuiz(
//       userId,
//       sessionId,
//       subject.id,
//       diagnosticPack.id,
//       "diagnostic",
//       FREE_TRIAL_QUESTION_COUNT,
//     );
//   }

//   // ── Paid: subject selected → show difficulty menu ─────────────────────────
//   private static async handleSubjectSelection(
//     userId: string,
//     sessionId: string,
//     subjectInput: string,
//   ): Promise<string> {
//     const subjects = await subjectService.getAllSubjects();
//     const subjectIndex = parseInt(subjectInput) - 1;

//     if (
//       isNaN(subjectIndex) ||
//       subjectIndex < 0 ||
//       subjectIndex >= subjects.length
//     ) {
//       return (
//         "CON Invalid choice. Choose a subject:\n" +
//         (await this.buildSubjectMenu())
//       );
//     }

//     const subject = subjects[subjectIndex];
//     await sessionService.updateLastMenu(userId, `subject_${subjectIndex}`);

//     return (
//       `CON ${subject.name}\n` +
//       "Choose difficulty:\n" +
//       "1. Bronze - 3 Qs (Recall)\n" +
//       "2. Silver - 5 Qs (Practice)\n" +
//       "3. Gold   - 8 Qs (Mock)\n" +
//       "00. Exit"
//     );
//   }

//   // ── Paid: difficulty selected → start quiz ────────────────────────────────
//   private static async handleDifficultySelection(
//     userId: string,
//     sessionId: string,
//     subjectInput: string,
//     difficultyInput: string,
//   ): Promise<string> {
//     const subjects = await subjectService.getAllSubjects();
//     const subjectIndex = parseInt(subjectInput) - 1;
//     const subject = subjects[subjectIndex];

//     if (!subject) return "END Invalid subject. Please dial again.";

//     const packTypes = ["diagnostic", "daily_drill", "full_mock"];
//     const packCounts = [3, 5, 8];
//     const diffIndex = parseInt(difficultyInput) - 1;

//     if (isNaN(diffIndex) || diffIndex < 0 || diffIndex > 2) {
//       return (
//         "CON Invalid choice.\n" +
//         "1. Bronze - 3 Qs (Recall)\n" +
//         "2. Silver - 5 Qs (Practice)\n" +
//         "3. Gold   - 8 Qs (Mock)\n" +
//         "00. Exit"
//       );
//     }

//     const packType = packTypes[diffIndex];
//     const questionCount = packCounts[diffIndex];

//     const packs = await examPackService.getPacksBySubjectId(subject.id);
//     const selectedPack = packs.find((p) => p.packType === packType);

//     if (!selectedPack) return "END No questions available. Please try again.";

//     return await this.startQuiz(
//       userId,
//       sessionId,
//       subject.id,
//       selectedPack.id,
//       packType,
//       questionCount,
//     );
//   }

//   // ── Payment menu ──────────────────────────────────────────────────────────
//   private static buildPaymentMenu(): string {
//     return (
//       "CON Welcome to Icyareta!\n" +
//       "P6 exam prep on any phone.\n" +
//       "Choose a plan:\n" +
//       "00. Exit"
//     );
//   }

//   // ── Payment selection → confirmation screen ───────────────────────────────
//   private static async handlePaymentSelection(
//     userId: string,
//     input: string,
//   ): Promise<string> {
//     if (input === "1") {
//       return (
//         "CON Daily Access - 2,000 RWF\n" +
//         "All 4 subjects, all levels\n" +
//         "Valid for 24 hours\n" +
//         "Pay via MoMo?\n" +
//         "1. Confirm\n" +
//         "2. Cancel"
//       );
//     }

//     if (input === "2") {
//       return (
//         "CON Weekly Access - 8,000 RWF\n" +
//         "All 4 subjects, all levels\n" +
//         "Valid for 7 days\n" +
//         "Pay via MoMo?\n" +
//         "1. Confirm\n" +
//         "2. Cancel"
//       );
//     }

//     return this.buildPaymentMenu();
//   }

//   // ── Payment confirmed → create purchase → prompt re-dial ─────────────────
//   private static async handlePaymentConfirmation(
//     userId: string,
//     phoneNumber: string,
//     planInput: string,
//     confirmInput: string,
//   ): Promise<string> {
//     if (confirmInput === "2") {
//       return "END Payment cancelled. Dial again when ready.";
//     }

//     if (confirmInput !== "1") {
//       return "CON Invalid choice.\n1. Confirm\n2. Cancel";
//     }

//     const accessType: AccessType = planInput === "1" ? "daily" : "weekly";
//     const transactionReference = `ICY-${Date.now()}`;

//     // ── PAYMENT PLACEHOLDER ──────────────────────────────────────────────
//     // Real MTN MoMo API call goes here when production keys are ready.
//     // For now we create the purchase directly to unblock testing.
//     // ────────────────────────────────────────────────────────────────────
//     await userPurchaseService.createPurchase(
//       userId,
//       accessType,
//       transactionReference,
//     );
//     await sessionService.updateLastMenu(userId, "paid");

//     const label = userPurchaseService.getAccessLabel(accessType);
//     const duration = accessType === "daily" ? "24 hours" : "7 days";

//     // Fire SMS — do not await, do not block
//     smsService.sendPaymentConfirmation(
//       phoneNumber,
//       label,
//       "All Subjects",
//       ACCESS_PRICES[accessType],
//       new Date(Date.now() + (accessType === "daily" ? 86400000 : 604800000)),
//     );

//     return (
//       `END ${label} activated!\n` +
//       `Valid for ${duration}.\n` +
//       "Dial again to start your quiz."
//     );
//   }

//   // ── Process an answer during a quiz ──────────────────────────────────────
//   private static async processAnswer(
//     activeSession: any,
//     userId: string,
//     phoneNumber: string,
//     steps: string[],
//   ): Promise<string> {
//     const assignedIds = activeSession.assignedQuestionIds as string[];
//     const currentIndex = activeSession.currentQuestionIndex;
//     const total = assignedIds.length;
//     const userInput = steps[steps.length - 1];

//     const question = await questionService.getQuestionById(
//       assignedIds[currentIndex],
//     );
//     if (!question) {
//       await sessionService.abandonSession(userId);
//       return "END Something went wrong. Please dial again.";
//     }

//     if (!["1", "2", "3", "4"].includes(userInput)) {
//       return `CON Invalid. Choose 1, 2, 3 or 4.\n${questionService.formatQuestionForUssd(question, currentIndex, total)}`;
//     }

//     const evaluation = questionService.evaluateAnswer(question, userInput);
//     const existingAnswers = (activeSession.answers as Answer[]) || [];
//     const updatedAnswers: Answer[] = [
//       ...existingAnswers,
//       {
//         questionId: question.id,
//         selectedOption: userInput,
//         isCorrect: evaluation.isCorrect,
//       },
//     ];

//     const nextIndex = currentIndex + 1;
//     await sessionService.updateSessionProgress(
//       userId,
//       nextIndex,
//       updatedAnswers,
//     );

//     if (nextIndex >= total) {
//       return await this.showScore(
//         { ...activeSession, answers: updatedAnswers },
//         userId,
//         phoneNumber,
//       );
//     }

//     const nextQuestion = await questionService.getQuestionById(
//       assignedIds[nextIndex],
//     );
//     if (!nextQuestion) {
//       await sessionService.abandonSession(userId);
//       return "END Something went wrong. Please dial again.";
//     }

//     return `CON ${questionService.formatQuestionForUssd(nextQuestion, nextIndex, total)}`;
//   }

//   // ── Start a quiz session ──────────────────────────────────────────────────
//   private static async startQuiz(
//     userId: string,
//     sessionId: string,
//     subjectId: string,
//     packId: string,
//     packType: string,
//     questionCount: number,
//   ): Promise<string> {
//     const assignedQuestionIds = await questionService.getQuestionsForSession(
//       packId,
//       packType,
//     );

//     // Trim to the exact count needed
//     const trimmed = assignedQuestionIds.slice(0, questionCount);

//     await sessionService.initializeQuiz(
//       userId,
//       sessionId,
//       subjectId,
//       packId,
//       trimmed,
//     );

//     const firstQuestion = await questionService.getQuestionById(trimmed[0]);
//     if (!firstQuestion) return "END No questions available. Please try again.";

//     return `CON ${questionService.formatQuestionForUssd(firstQuestion, 0, trimmed.length)}`;
//   }

//   // ── Show final score ──────────────────────────────────────────────────────
//   private static async showScore(
//     session: {
//       answers: unknown;
//       selectedSubjectId?: string | null;
//       selectedPackId?: string | null;
//     },
//     userId: string,
//     phoneNumber: string,
//   ): Promise<string> {
//     const answers = (session.answers as Answer[]) || [];
//     const result = questionService.calculateScore(answers);

//     await sessionService.completeSession(userId);

//     // Deactivate free trial purchase after completion
//     const purchase = await userPurchaseService.getActivePurchase(userId);
//     if (purchase && purchase.accessType === "free_trial") {
//       await userPurchaseService.deactivatePurchase(purchase.id);
//     }

//     // Save result
//     if (session.selectedSubjectId && session.selectedPackId) {
//       const pack = await examPackService.getPackById(session.selectedPackId);
//       if (pack) {
//         await examResultService.saveResult(
//           userId,
//           session.selectedSubjectId,
//           pack.packType,
//           result.score,
//           result.total,
//         );
//       }
//     }

//     // Resolve subject name for SMS
//     let subjectName = "your subject";
//     if (session.selectedSubjectId) {
//       const subject = await subjectService.getSubjectById(
//         session.selectedSubjectId,
//       );
//       if (subject) subjectName = subject.name;
//     }

//     // Send performance SMS — fire and forget
//     smsService.sendPerformanceReport(
//       phoneNumber,
//       subjectName,
//       "Icyareta",
//       result.score,
//       result.total,
//       result.percentage,
//     );

//     // Upsell SMS 5 minutes later if score below 60% and user has no active paid access
//     const activePurchase = await userPurchaseService.getActivePurchase(userId);
//     const hasPaidAccess =
//       activePurchase && activePurchase.accessType !== "free_trial";

//     if (result.percentage < 60 && !hasPaidAccess) {
//       setTimeout(
//         () => {
//           smsService.sendUpsellMessage(
//             phoneNumber,
//             subjectName,
//             "Free Trial",
//             "Daily Access",
//             ACCESS_PRICES.daily,
//           );
//         },
//         5 * 60 * 1000,
//       );
//     }

//     const encouragement =
//       result.percentage >= 60
//         ? "Great work! Keep practicing."
//         : "Keep going! More practice = better results.";

//     const hasPaid =
//       activePurchase && activePurchase.accessType !== "free_trial";

//     return (
//       `END Score: ${result.display}\n` +
//       `${encouragement}\n` +
//       (hasPaid
//         ? "Dial again to practice more."
//         : `Dial again to unlock all subjects.\nDaily: 2,000 RWF | Weekly: 8,000 RWF`)
//     );
//   }

//   // ── Build subject menu dynamically from DB ────────────────────────────────
//   private static async buildSubjectMenu(): Promise<string> {
//     const subjects = await subjectService.getAllSubjects();
//     let menu = "";
//     subjects.forEach((s, i) => {
//       menu += `${i + 1}. ${s.name}\n`;
//     });
//     menu += "00. Exit";
//     return menu;
//   }
// }
