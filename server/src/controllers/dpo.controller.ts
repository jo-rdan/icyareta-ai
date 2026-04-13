import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  UserPurchaseService,
  AccessType,
  ACCESS_PRICES,
} from "../services/user-purchase.service";
import { UserService } from "../services/user.service";
import { DpoService } from "../services/ui/dpo.service";

const dpoService = new DpoService();
const purchaseService = new UserPurchaseService();
const userService = new UserService();

const PAID_TYPES: AccessType[] = ["day_pass", "week_pass"];

/**
 * POST /api/payment/dpo/initiate
 * Body: { accessType }
 *
 * Creates a DPO transaction token and returns the payment URL.
 * Frontend redirects the user to that URL.
 */
export const initiateDpoPayment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId!;
  const { accessType } = req.body as { accessType: AccessType };

  if (!PAID_TYPES.includes(accessType)) {
    res.status(400).json({ error: "accessType must be day_pass or week_pass" });
    return;
  }

  const existing = await purchaseService.getActivePurchase(userId);
  if (existing && PAID_TYPES.includes(existing.accessType)) {
    res.status(409).json({
      error: `You already have an active ${purchaseService.getAccessLabel(existing.accessType)}`,
    });
    return;
  }

  const amount = ACCESS_PRICES[accessType];
  const label = purchaseService.getAccessLabel(accessType);
  // companyRef ties this transaction to the user — used during verify
  const companyRef = `${userId.slice(0, 8)}-${accessType}-${Date.now()}`;

  const { transToken, paymentUrl } = await dpoService.createToken(
    amount,
    "RWF",
    companyRef,
    `Xeta ${label} - Full P6 Access`,
  );

  res.json({ transToken, paymentUrl, amount, accessType, label });
};

/**
 * GET /api/payment/dpo/return?TransactionToken=xxx&CompanyRef=xxx
 *
 * DPO redirects the user here after payment (success or failure).
 * We verify the token and activate the purchase, then redirect the user
 * back into the app.
 *
 * This is a GET because DPO appends query params on redirect.
 * No auth middleware — user arrives here from DPO, not from our app.
 * We identify the user from CompanyRef which we embedded at initiate time.
 */
export const dpoReturnHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { TransactionToken, CompanyRef } = req.query as {
    TransactionToken?: string;
    CompanyRef?: string;
  };

  const PWA_URL = process.env.PWA_ORIGIN || "http://localhost:5173";

  if (!TransactionToken || !CompanyRef) {
    res.redirect(`${PWA_URL}/pricing?payment=failed`);
    return;
  }

  // Extract userId and accessType from the companyRef we built at initiate time
  // Format: "{userId8chars}-{accessType}-{timestamp}"
  const parts = CompanyRef.split("-");
  if (parts.length < 2) {
    res.redirect(`${PWA_URL}/pricing?payment=failed`);
    return;
  }

  const accessType = parts[1] as AccessType;
  if (!PAID_TYPES.includes(accessType)) {
    res.redirect(`${PWA_URL}/pricing?payment=failed`);
    return;
  }

  try {
    const result = await dpoService.verifyToken(TransactionToken);

    if (result.status === "SUCCESSFUL") {
      // Find user by the partial userId in CompanyRef
      // Since we only have 8 chars we query by the transactionReference instead
      const existing =
        await purchaseService.getPurchaseByTransactionRef(TransactionToken);

      if (!existing) {
        // First time — we need to find the user. Since DPO doesn't carry our
        // JWT, we stored the userId prefix in CompanyRef. Use it to look up.
        // This is why we store transToken in a pending purchase at initiate time.
        // For now redirect with the token so the frontend can call verify.
        res.redirect(
          `${PWA_URL}/app/subjects?payment=success&token=${TransactionToken}`,
        );
        return;
      }

      res.redirect(`${PWA_URL}/app/subjects?payment=success`);
      return;
    }

    res.redirect(`${PWA_URL}/pricing?payment=failed`);
  } catch {
    res.redirect(`${PWA_URL}/pricing?payment=failed`);
  }
};

/**
 * POST /api/payment/dpo/verify
 * Body: { transToken, accessType }
 *
 * Called by the frontend after the user returns from DPO.
 * Verifies payment and activates the user's access.
 * Uses JWT auth — user is back in the app at this point.
 */
export const verifyDpoPayment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const userId = req.userId!;
  const { transToken, accessType } = req.body as {
    transToken: string;
    accessType?: AccessType;
  };

  if (!transToken) {
    res.status(400).json({ error: "transToken is required" });
    return;
  }

  // Idempotent check — already activated
  const existing = await purchaseService.getActivePurchase(userId);
  if (existing?.transactionReference === transToken) {
    res.json({ status: "SUCCESSFUL", activated: true });
    return;
  }

  const result = await dpoService.verifyToken(transToken);

  if (result.status === "SUCCESSFUL") {
    const resolvedType: AccessType =
      accessType && PAID_TYPES.includes(accessType) ? accessType : "day_pass";
    await purchaseService.createPurchase(userId, resolvedType, transToken);
    res.json({ status: "SUCCESSFUL", activated: true });
    return;
  }

  res.json({ status: result.status, activated: false });
};
