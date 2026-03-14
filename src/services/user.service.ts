import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export type User = typeof users.$inferSelect;

export class UserService {
  /**
   * Looks up a user by phone number.
   * If they don't exist, creates them and returns the new record.
   * This is called on every single USSD hit — it is the entry point
   * for the entire session lifecycle.
   */
  async findOrCreateUserByPhoneNumber(phoneNumber: string): Promise<User> {
    // 1. Try to find existing user
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // 2. Not found — create new user
    const [newUser] = await db
      .insert(users)
      .values({ phoneNumber })
      .returning();

    return newUser;
  }
}
