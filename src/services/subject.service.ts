import { eq } from "drizzle-orm";
import { db } from "../db";
import { subjects } from "../db/schema";

export type Subject = typeof subjects.$inferSelect;

export class SubjectService {
  /**
   * Returns all subjects ordered alphabetically.
   * Used to build the subject selection menu in the USSD flow.
   */
  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).orderBy(subjects.name);
  }

  /**
   * Returns a single subject by ID.
   * Returns null if not found — caller must handle this case.
   */
  async getSubjectById(id: string): Promise<Subject | null> {
    const result = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1);

    return result[0] ?? null;
  }
}
