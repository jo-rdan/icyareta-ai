import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { UserService } from "../services/user.service";
import { UserPurchaseService } from "../services/user-purchase.service";
import { ExamResultService } from "../services/exam-result.service";
import { db } from "../db";
import { subjects } from "../db/schema";
import { eq } from "drizzle-orm";

const userService = new UserService();
const purchaseService = new UserPurchaseService();
const resultService = new ExamResultService();

/**
 * GET /api/user/me
 * Returns the current user profile plus active access status.
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;

  const user = await userService.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const activePurchase = await purchaseService.getActivePurchase(userId);

  let accessStatus: "none" | "trial_used" | "active" | "expired" = "none";
  if (activePurchase) {
    accessStatus = "active";
  } else if (user.hasUsedFreeTrial) {
    accessStatus = "trial_used";
  }

  res.json({
    id: user.id,
    phoneNumber: user.phoneNumber,
    hasUsedFreeTrial: user.hasUsedFreeTrial,
    accessStatus,
    accessExpiresAt: activePurchase?.expiresAt ?? null,
    accessType: activePurchase?.accessType ?? null,
  });
};

/**
 * GET /api/user/results
 * Returns all past quiz results for the current user, most recent first.
 */
export const getResults = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId!;

  const results = await resultService.getResultsByUser(userId);

  // Enrich with subject name
  const enriched = await Promise.all(
    results.map(async (r) => {
      const subjectRows = await db
        .select({ name: subjects.name })
        .from(subjects)
        .where(eq(subjects.id, r.subjectId))
        .limit(1);

      return {
        id: r.id,
        subjectName: subjectRows[0]?.name ?? "Unknown",
        subjectId: r.subjectId,
        packType: r.packType,
        score: r.score,
        totalQuestions: r.totalQuestions,
        percentage: Math.round((r.score / r.totalQuestions) * 100),
        takenAt: r.takenAt,
      };
    }),
  );

  res.json(enriched);
};
