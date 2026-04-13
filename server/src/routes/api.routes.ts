import { Router } from "express";
import { requestOtp, verifyOtp } from "../controllers/auth.controller";
import {
  getMe,
  getResults,
  updatePhone,
  updateChildName,
} from "../controllers/user.controller";
import { getAllSubjects } from "../controllers/subject.controller";
import {
  startQuiz,
  submitAnswer,
  getSession,
} from "../controllers/quiz.controller";
import {
  initiatePayment,
  paymentCallback,
  verifyPayment,
} from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth.middleware";
import { signinWithGoogle } from "../controllers/google-auth.controller";
import {
  dpoReturnHandler,
  initiateDpoPayment,
  verifyDpoPayment,
} from "../controllers/dpo.controller";

const router = Router();

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post("/auth/request-otp", requestOtp);
router.post("/auth/verify-otp", verifyOtp);
router.post("/auth/google-signin", signinWithGoogle);

// ── Subjects (public) ─────────────────────────────────────────────────────────
router.get("/subjects", getAllSubjects);

// ── User ──────────────────────────────────────────────────────────────────────
router.get("/user/me", authenticate, getMe);
router.get("/user/results", authenticate, getResults);
router.patch("/user/phone", authenticate, updatePhone);
router.put("/user/child-name", authenticate, updateChildName);

// ── Quiz ──────────────────────────────────────────────────────────────────────
router.post("/quiz/start", authenticate, startQuiz);
router.post("/quiz/answer", authenticate, submitAnswer);
router.get("/quiz/session", authenticate, getSession);

// ── Payment ───────────────────────────────────────────────────────────────────
router.post("/payment/initiate", authenticate, initiatePayment);
router.post("/payment/callback", paymentCallback);
router.post("/payment/verify", authenticate, verifyPayment);

// ── DPO payments ──────────────────────────────────────────────────────────────
router.post("/payment/dpo/initiate", authenticate, initiateDpoPayment);
router.get("/payment/dpo/return", dpoReturnHandler); // DPO redirects here — no auth
router.post("/payment/dpo/verify", authenticate, verifyDpoPayment);

export default router;
