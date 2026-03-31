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

/**
 * POST /api/v1/payment/initiate
 * Body: { accessType: "day_pass" }
 * Initiates a MoMo payment request and returns the referenceId.
 */
export const initiatePayment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId!;
  const phoneNumber = req.phoneNumber!;
  const { accessType } = req.body as { accessType: AccessType };

  if (accessType !== "day_pass") {
    res.status(400).json({ error: "accessType must be day_pass" });
    return;
  }

  const existing = await purchaseService.getActivePurchase(userId);
  if (existing && existing.accessType === "day_pass") {
    res.status(409).json({ error: "You already have an active Day Pass" });
    return;
  }

  const amount = ACCESS_PRICES.day_pass;
  const externalId = `ICY-${userId.slice(0, 8)}-${Date.now()}`;

  const referenceId = await momoService.requestToPay(
    phoneNumber,
    amount,
    externalId,
    "Icyareta Day Pass — Full P6 Access",
  );

  res.json({
    referenceId,
    amount,
    accessType: "day_pass",
    message:
      "Payment request sent to your phone. Approve it to activate your Day Pass.",
  });
};

/**
 * POST /api/v1/payment/callback
 * Called by MTN MoMo — always returns 200.
 */
export const paymentCallback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // Acknowledge immediately — payment activation handled via /verify polling
  console.log("MoMo callback received:", JSON.stringify(req.body));
  res.status(200).json({ received: true });
};

/**
 * POST /api/v1/payment/verify
 * Body: { referenceId }
 * PWA polls this after initiating payment. Activates Day Pass on success.
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

  // Check if already activated for this reference
  const existing = await purchaseService.getActivePurchase(userId);
  if (existing?.transactionReference === referenceId) {
    res.json({ status: "SUCCESSFUL", activated: true, alreadyActive: true });
    return;
  }

  const result = await momoService.getPaymentStatus(referenceId);

  if (result.status === "SUCCESSFUL") {
    await purchaseService.createPurchase(userId, "day_pass", referenceId);
    res.json({ status: "SUCCESSFUL", activated: true });
    return;
  }

  res.json({ status: result.status, activated: false });
};
