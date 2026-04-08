/**
 * Seed script — creates one test parent with an active Day Pass for testing.
 *
 * Usage:  npx tsx src/scripts/seed.ts
 *
 * What it creates:
 *   - User: test@icyareta.rw / +250788000001 / child: Amara
 *   - Active Day Pass (expires in 23 hours so you can test the expiry flow)
 *   - 4 exam results (one per subject, mixed scores) so the dashboard is populated
 *
 * OTP to log in: because OTPs are in-memory and expire, use Postman to call
 *   POST /api/auth/request-otp { "email": "test@icyareta.rw" }
 * then check your server logs for the printed code (email may not arrive locally).
 */

import * as dotenv from "dotenv";
dotenv.config();

import { db } from "../db";
import {
  users,
  userPurchases,
  examResults,
  subjects,
  examPacks,
} from "../db/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding test data...");

  // ── 1. Upsert test user ───────────────────────────────────────────────────
  const email = "test@icyareta.rw";
  const phoneNumber = "+250788000001";

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId: string;

  if (existing.length > 0) {
    userId = existing[0].id;
    await db
      .update(users)
      .set({ childName: "Amara", hasUsedFreeTrial: true, phoneNumber })
      .where(eq(users.id, userId));
    console.log("  ↺ Existing user updated:", email);
  } else {
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        phoneNumber,
        childName: "Amara",
        hasUsedFreeTrial: true,
      })
      .returning();
    userId = newUser.id;
    console.log("  ✓ User created:", email);
  }

  // ── 2. Active Day Pass (expires in 23h so you can test the countdown) ─────
  await db
    .update(userPurchases)
    .set({ isActive: false })
    .where(eq(userPurchases.userId, userId));

  const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000); // 23 hours from now

  await db.insert(userPurchases).values({
    userId,
    accessType: "day_pass",
    amountPaid: 800,
    transactionReference: "SEED-TEST-REF-001",
    isActive: true,
    expiresAt,
  });
  console.log("  ✓ Day Pass created, expires:", expiresAt.toISOString());

  // ── 3. Seed exam results ──────────────────────────────────────────────────
  const allSubjects = await db.select().from(subjects);

  if (allSubjects.length === 0) {
    console.log(
      "  ⚠ No subjects found — run question ingestion first. Skipping results.",
    );
  } else {
    // Delete any existing results for this user
    await db.delete(examResults).where(eq(examResults.userId, userId));

    const mockScores = [
      { score: 9, total: 12 }, // 75%
      { score: 6, total: 12 }, // 50%
      { score: 11, total: 12 }, // 92%
      { score: 7, total: 12 }, // 58%
    ];

    for (let i = 0; i < Math.min(allSubjects.length, 4); i++) {
      const subject = allSubjects[i];
      const { score, total } = mockScores[i];

      const takenAt = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000); // spread over past days

      await db.insert(examResults).values({
        userId,
        subjectId: subject.id,
        packType: "full_mock",
        score,
        totalQuestions: total,
        takenAt,
      });
      console.log(`  ✓ Result: ${subject.name} — ${score}/${total}`);
    }
  }

  // ── 4. Print login instructions ───────────────────────────────────────────
  console.log("\n✅ Seed complete!\n");
  console.log("  Email:      test@icyareta.rw");
  console.log("  Child:      Amara");
  console.log("  Phone:      +250788000001");
  console.log("  Access:     Day Pass (expires in ~23 hours)\n");
  console.log("  To log in:");
  console.log(
    '  1. POST /api/auth/request-otp  { "email": "test@icyareta.rw" }',
  );
  console.log("  2. Check server logs for the OTP code (printed to stdout)");
  console.log(
    '  3. POST /api/auth/verify-otp   { "email": "test@icyareta.rw", "code": "XXXX" }',
  );
  console.log("  4. Use the returned token as Bearer in all requests\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
