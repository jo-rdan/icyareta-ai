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

/** GET /api/user/me */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const user = await userService.findById(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const activePurchase = await purchaseService.getActivePurchase(userId);
  let accessStatus: "none" | "trial_used" | "active" = "none";
  if (activePurchase) accessStatus = "active";
  else if (user.hasUsedFreeTrial) accessStatus = "trial_used";

  res.json({
    id: user.id,
    email: user.email,
    phoneNumber: user.phoneNumber,
    childName: user.childName,
    hasUsedFreeTrial: user.hasUsedFreeTrial,
    accessStatus,
    accessExpiresAt: activePurchase?.expiresAt ?? null,
    accessType: activePurchase?.accessType ?? null,
  });
};

/** GET /api/user/results */
export const getResults = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId!;
  const results = await resultService.getResultsByUser(userId);

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

/** PATCH /api/user/phone */
export const updatePhone = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    res.status(400).json({ error: "phoneNumber is required" });
    return;
  }
  await userService.updatePhoneNumber(req.userId!, phoneNumber);
  res.json({ success: true });
};

/** PATCH /api/user/child-name */
export const updateChildName = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { childName } = req.body;
    if (!childName || typeof childName !== "string" || !childName.trim()) {
      res.status(400).json({ error: "childName is required" });
      return;
    }
    await userService.updateChildName(req.userId!, childName.trim());
    res.json({ success: true });
  } catch (error) {
    console.error("data");
  }
};
