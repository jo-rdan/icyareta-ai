import { eq, and, gt } from "drizzle-orm";
import { db } from "../db";
import { userPurchases, users } from "../db/schema";

export type UserPurchase = typeof userPurchases.$inferSelect;
export type AccessType = "free_trial" | "day_pass" | "week_pass";

export const ACCESS_PRICES: Record<AccessType, number> = {
  free_trial: 0,
  day_pass: 800,
  week_pass: 5000,
};

const ACCESS_DURATIONS_MS: Record<AccessType, number> = {
  free_trial: 60 * 60 * 1000,
  day_pass: 24 * 60 * 60 * 1000,
  week_pass: 7 * 24 * 60 * 60 * 1000,
};

export class UserPurchaseService {
  async createPurchase(
    userId: string,
    accessType: AccessType,
    transactionReference: string | null = null,
  ): Promise<UserPurchase> {
    const purchasedAt = new Date();
    const expiresAt = new Date(
      purchasedAt.getTime() + ACCESS_DURATIONS_MS[accessType],
    );

    const [purchase] = await db
      .insert(userPurchases)
      .values({
        userId,
        accessType,
        amountPaid: ACCESS_PRICES[accessType],
        transactionReference,
        isActive: true,
        purchasedAt,
        expiresAt,
      })
      .returning();

    if (accessType === "free_trial") {
      await db
        .update(users)
        .set({ hasUsedFreeTrial: true })
        .where(eq(users.id, userId));
    }

    return purchase;
  }

  async getActivePurchase(userId: string): Promise<UserPurchase | null> {
    const now = new Date();
    const result = await db
      .select()
      .from(userPurchases)
      .where(
        and(
          eq(userPurchases.userId, userId),
          eq(userPurchases.isActive, true),
          gt(userPurchases.expiresAt, now),
        ),
      )
      .orderBy(userPurchases.expiresAt)
      .limit(1);
    return result[0] ?? null;
  }

  async deactivatePurchase(purchaseId: string): Promise<void> {
    await db
      .update(userPurchases)
      .set({ isActive: false })
      .where(eq(userPurchases.id, purchaseId));
  }

  getAccessLabel(accessType: AccessType): string {
    return {
      free_trial: "Free Trial",
      day_pass: "Day Pass",
      week_pass: "Week Pass",
    }[accessType];
  }
}
