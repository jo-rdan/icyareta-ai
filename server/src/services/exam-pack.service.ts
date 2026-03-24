import { eq } from "drizzle-orm";
import { db } from "../db";
import { examPacks } from "../db/schema";

export type ExamPack = typeof examPacks.$inferSelect;

// Display order for pack types in the USSD menu
const PACK_ORDER: Record<string, number> = {
  diagnostic: 1,
  daily_drill: 2,
  full_mock: 3,
};

export class ExamPackService {
  /**
   * Returns all packs for a given subject, ordered Bronze → Silver → Gold.
   * Used to build the pack selection menu after the student picks a subject.
   */
  async getPacksBySubjectId(subjectId: string): Promise<ExamPack[]> {
    const packs = await db
      .select()
      .from(examPacks)
      .where(eq(examPacks.subjectId, subjectId));

    return packs.sort(
      (a, b) => (PACK_ORDER[a.packType] ?? 99) - (PACK_ORDER[b.packType] ?? 99),
    );
  }

  /**
   * Returns a single pack by ID.
   * Returns null if not found — caller must handle this case.
   */
  async getPackById(id: string): Promise<ExamPack | null> {
    const result = await db
      .select()
      .from(examPacks)
      .where(eq(examPacks.id, id))
      .limit(1);

    return result[0] ?? null;
  }
}
