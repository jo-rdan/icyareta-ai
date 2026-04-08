import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export type User = typeof users.$inferSelect;

export class UserService {
  /** USSD: find or create by phone number */
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

  /** PWA: find or create by email. Stores phone number if provided. */
  async findOrCreateUserByEmail(
    email: string,
    phoneNumber?: string,
    childName?: string,
  ): Promise<User> {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length > 0) {
      // Update phone/childName if this is a new device or first time
      const updates: Partial<typeof users.$inferInsert> = {};
      if (
        phoneNumber &&
        (!existing[0].phoneNumber ||
          existing[0].phoneNumber === existing[0].email)
      ) {
        updates.phoneNumber = phoneNumber;
      }
      if (childName && !existing[0].childName) {
        updates.childName = childName;
      }
      if (Object.keys(updates).length > 0) {
        const [updated] = await db
          .update(users)
          .set(updates)
          .where(eq(users.id, existing[0].id))
          .returning();
        return updated;
      }
      return existing[0];
    }
    const [newUser] = await db
      .insert(users)
      .values({
        phoneNumber: phoneNumber ?? email,
        email,
        childName: childName ?? null,
      })
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

  async updateChildName(userId: string, childName: string): Promise<void> {
    await db.update(users).set({ childName }).where(eq(users.id, userId));
  }
}
