import { eq, and, gt } from "drizzle-orm";
import { db } from "../db";
import { userPurchases } from "../db/schema";

export type UserPurchase = typeof userPurchases.$inferSelect;

export class UserPurchaseService {
  /**
   * Creates a new purchase record after a successful payment.
   * Sets expiry to 24 hours from now — the window to complete the quiz.
   *
   * For bundle purchases, this is called once per subject pack (4 times total).
   * All 4 rows share the same transactionReference and have isBundle=true.
   * bundlePrice stores the total amount the user actually paid (e.g. 2500 RWF)
   * since each individual pack row only shows 500 RWF.
   */
  async createPurchase(
    userId: string,
    packId: string,
    transactionReference: string,
    isBundle: boolean = false,
    bundlePrice: number | null = null,
  ): Promise<UserPurchase> {
    const purchasedAt = new Date();
    const expiresAt = new Date(purchasedAt.getTime() + 24 * 60 * 60 * 1000);

    const [purchase] = await db
      .insert(userPurchases)
      .values({
        userId,
        packId,
        transactionReference,
        isActive: true,
        isBundle,
        bundlePrice,
        purchasedAt,
        expiresAt,
      })
      .returning();

    return purchase;
  }

  /**
   * Returns the user's active, non-expired purchase for a specific pack.
   * This is the permission gate — if this returns null, the user cannot
   * access questions for that pack.
   */
  async getActivePurchase(
    userId: string,
    packId: string,
  ): Promise<UserPurchase | null> {
    const now = new Date();

    const result = await db
      .select()
      .from(userPurchases)
      .where(
        and(
          eq(userPurchases.userId, userId),
          eq(userPurchases.packId, packId),
          eq(userPurchases.isActive, true),
          gt(userPurchases.expiresAt, now),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Marks a purchase as inactive once the quiz is completed.
   * Prevents re-entry into the same pack without paying again.
   */
  async deactivatePurchase(purchaseId: string): Promise<void> {
    await db
      .update(userPurchases)
      .set({ isActive: false })
      .where(eq(userPurchases.id, purchaseId));
  }
}
