import { Request, Response } from "express";
import { SubjectService } from "../services/subject.service";

const subjectService = new SubjectService();

/**
 * GET /api/subjects
 * Returns all subjects. No auth required — used on the free trial screen too.
 */
export const getAllSubjects = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  const allSubjects = await subjectService.getAllSubjects();
  res.json(allSubjects);
};
