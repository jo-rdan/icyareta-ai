import { Router } from "express";
import { requestOtp, verifyOtp } from "../controllers/auth.controller";
import { getMe, getResults, updatePhone } from "../controllers/user.controller";
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

const router = Router();

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post("/auth/request-otp", requestOtp);
router.post("/auth/verify-otp", verifyOtp);
router.post("/auth/google-signin", signinWithGoogle);

// ── Subjects (public) ─────────────────────────────────────────────────────────
router.get("/subjects", getAllSubjects);

// ── User (protected) ──────────────────────────────────────────────────────────
router.get("/user/me", authenticate, getMe);
router.get("/user/results", authenticate, getResults);

// ── Quiz (protected) ──────────────────────────────────────────────────────────
router.post("/quiz/start", authenticate, startQuiz);
router.post("/quiz/answer", authenticate, submitAnswer);
router.get("/quiz/session", authenticate, getSession);

// ── User phone update ────────────────────────────────────────────────────────
router.put("/user/phone", authenticate, updatePhone);

// ── Payment (protected + public callback) ────────────────────────────────────
router.post("/payment/initiate", authenticate, initiatePayment);
router.post("/payment/callback", paymentCallback); // MTN calls this — no JWT
router.post("/payment/verify", authenticate, verifyPayment);

export default router;
