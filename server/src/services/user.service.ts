import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export type User = typeof users.$inferSelect;

export class UserService {
  /**
   * USSD entry point — find or create by phone number.
   */
  async findOrCreateUserByPhoneNumber(phoneNumber: string): Promise<User> {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber))
      .limit(1);
    if (existing.length > 0) return existing[0];
    const [newUser] = await db
      .insert(users)
      .values({ phoneNumber })
      .returning();
    return newUser;
  }

  /**
   * PWA entry point — find or create by email.
   * phoneNumber stored if provided for MoMo payments.
   * If no phoneNumber yet, email is used as placeholder until user adds it before payment.
   */
  async findOrCreateUserByEmail(
    email: string,
    phoneNumber?: string,
  ): Promise<User> {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      if (
        phoneNumber &&
        (!existing[0].phoneNumber ||
          existing[0].phoneNumber === existing[0].email)
      ) {
        const [updated] = await db
          .update(users)
          .set({ phoneNumber })
          .where(eq(users.id, existing[0].id))
          .returning();
        return updated;
      }
      return existing[0];
    }

    const [newUser] = await db
      .insert(users)
      .values({ phoneNumber: phoneNumber ?? email, email })
      .returning();

    return newUser;
  }

  async findById(userId: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return result[0] ?? null;
  }

  async markTrialUsed(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ hasUsedFreeTrial: true })
      .where(eq(users.id, userId));
  }

  async updatePhoneNumber(userId: string, phoneNumber: string): Promise<void> {
    await db.update(users).set({ phoneNumber }).where(eq(users.id, userId));
  }
}
