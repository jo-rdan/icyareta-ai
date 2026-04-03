import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  UserPurchaseService,
  AccessType,
  ACCESS_PRICES,
} from "../services/user-purchase.service";
import { MomoService } from "../services/ui/momo.service";

const momoService = new MomoService();
const purchaseService = new UserPurchaseService();

const PAID_ACCESS_TYPES: AccessType[] = ["day_pass", "week_pass", "month_pass"];

/**
 * POST /api/payment/initiate
 * Body: { accessType: "day_pass" | "week_pass" | "month_pass" }
 */
export const initiatePayment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId!;
  const phoneNumber = req.phoneNumber!;
  const { accessType } = req.body as { accessType: AccessType };

  if (!PAID_ACCESS_TYPES.includes(accessType)) {
    res
      .status(400)
      .json({ error: "accessType must be day_pass, week_pass, or month_pass" });
    return;
  }

  const existing = await purchaseService.getActivePurchase(userId);
  if (existing && PAID_ACCESS_TYPES.includes(existing.accessType)) {
    res.status(409).json({
      error: `You already have an active ${purchaseService.getAccessLabel(existing.accessType)}`,
    });
    return;
  }

  const amount = ACCESS_PRICES[accessType];
  const externalId = `ICY-${userId.slice(0, 8)}-${Date.now()}`;
  const label = purchaseService.getAccessLabel(accessType);

  const referenceId = await momoService.requestToPay(
    phoneNumber,
    amount,
    externalId,
    `Icyareta ${label} — Full P6 Access`,
  );

  res.json({ referenceId, amount, accessType, label });
};

/**
 * POST /api/payment/callback
 * Called by MTN MoMo — always returns 200 immediately.
 */
export const paymentCallback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  console.log("MoMo callback:", JSON.stringify(req.body));
  res.status(200).json({ received: true });
};

/**
 * POST /api/payment/verify
 * Body: { referenceId }
 * PWA polls this after initiating payment. Creates purchase on success.
 */
export const verifyPayment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId!;
  const { referenceId } = req.body as { referenceId: string };

  if (!referenceId) {
    res.status(400).json({ error: "referenceId is required" });
    return;
  }

  // Already activated — idempotent
  const existing = await purchaseService.getActivePurchase(userId);
  if (existing?.transactionReference === referenceId) {
    res.json({ status: "SUCCESSFUL", activated: true });
    return;
  }

  const result = await momoService.getPaymentStatus(referenceId);

  if (result.status === "SUCCESSFUL") {
    // We need the accessType — it's embedded in the externalId prefix but we don't store it.
    // Safest approach: the PWA sends it along with the referenceId.
    const { accessType } = req.body as { accessType?: AccessType };
    const resolvedType: AccessType =
      accessType && PAID_ACCESS_TYPES.includes(accessType)
        ? accessType
        : "day_pass";

    await purchaseService.createPurchase(userId, resolvedType, referenceId);
    res.json({ status: "SUCCESSFUL", activated: true });
    return;
  }

  res.json({ status: result.status, activated: false });
};
