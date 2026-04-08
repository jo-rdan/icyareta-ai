/**
 * Xeta — Question Ingestion Pipeline
 *
 * Reads PDF exam papers from /data, sends them to Gemini, and inserts
 * generated questions into the database.
 *
 * Usage:
 *   Place PDF files named  YYYY_P6_SubjectName.pdf  in the /data folder.
 *   Then run:  npx tsx src/scripts/ingest.ts
 *
 * Each PDF produces ~40 questions in a single "full_mock" pack per subject.
 * Running the script again with the same PDFs is safe — it appends questions
 * to existing packs rather than duplicating them.
 */

import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import { GoogleGenAI } from "@google/genai";
import { db } from "../db";
import { questions, subjects, examPacks } from "../db/schema";
import * as dotenv from "dotenv";
import { eq, and } from "drizzle-orm";

dotenv.config();

// ─── Config ───────────────────────────────────────────────────────────────────

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * We keep a single pack type in the DB ("full_mock") as a container for all
 * questions. The PWA doesn't distinguish pack tiers — every paying user gets
 * access to all questions for a subject.
 */
const PACK_TYPE = "full_mock" as const;
const PACK_PRICE = 0; // price is on userPurchases, not on the pack itself

const QUESTIONS_PER_BATCH = 20;
const BATCHES_PER_PDF = 2; // 2 × 20 = 40 questions per subject per year

// ─── PDF Extraction ───────────────────────────────────────────────────────────

async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const uint8Array = new Uint8Array(
    dataBuffer.buffer,
    dataBuffer.byteOffset,
    dataBuffer.byteLength,
  );
  const parser = new PDFParse(uint8Array);
  const result = await parser.getText();
  return result.text;
}

// ─── Subject Name Normalisation ───────────────────────────────────────────────

function normalizeSubjectName(raw: string): string {
  return raw
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/Social and Religious Studies/i, "Social & Religious Studies")
    .replace(/Social\s+Religious Studies/i, "Social & Religious Studies")
    .replace(
      /Science and Elementary Technology/i,
      "Science & Elementary Technology",
    )
    .trim();
}

// ─── Gemini Question Generation ───────────────────────────────────────────────

interface ExtractedQuestion {
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
}

function subjectFocus(subjectName: string): string {
  if (subjectName === "Mathematics") {
    return "Cover: integers, fractions, decimals, percentages, geometry, statistics, ratio, time, measurement, algebra, LCM/GCF. Include word problems.";
  }
  if (subjectName === "English Language") {
    return "Cover: vocabulary, grammar (pronouns, verb tenses, conjunctions, prepositions, question tags, articles), reading comprehension, punctuation. Convert fill-in-the-blank to MCQ format.";
  }
  if (subjectName.includes("Science")) {
    return "Cover: living things, plants, animals, human body systems, sound, light, electricity, materials, states of matter, farming, environment, health.";
  }
  return "Cover: Rwanda geography, history, civic education, health education, cooperative societies, leadership, environmental studies, religious studies.";
}

async function extractQuestionsWithGemini(
  rawText: string,
  subjectName: string,
  year: number,
  batch: number,
): Promise<ExtractedQuestion[]> {
  const prompt = `You are generating multiple-choice practice questions for Xeta, a Rwandan P6 national exam preparation app. These questions will appear on a mobile screen with full readable text—no character limits apply.

## TASK
Generate exactly ${QUESTIONS_PER_BATCH} multiple-choice questions.
Subject: ${subjectName}
Year: ${year}
Batch: ${batch} of ${BATCHES_PER_PDF} — generate DIFFERENT questions from any previous batch, no repeats.

## COPYRIGHT PROTECTION & ORIGINALITY (CRITICAL RULE)
The "EXAM CONTENT" provided below is for TOPIC REFERENCE ONLY. You must never copy NESA's expression. 
- NEVER copy question text or distractors verbatim.
- If the PDF uses a specific scenario (e.g., "A car travels at 60km/h"), change the numbers, names, and objects (e.g., "A motorbike travels at 45km/h").
- Do not mirror sentence structures. If the PDF asks "Which is NOT a part of...?", rephrase it as "Identify the item that does not belong to..."
- Distractors must be your own original, plausible mistakes, not the same group of wrong answers used in the PDF.
- SELF-CHECK: If 5 or more consecutive words match the PDF, rewrite the question.

## QUESTION QUALITY
- Mix difficulty: 40% straightforward recall, 40% application, 20% multi-step reasoning.
- Every question must be SELF-CONTAINED — no "according to the passage" questions.
- For Mathematics: Solve the problem yourself first to verify the answer before writing the options.
- For English: Convert fill-in-the-blank sections into proper MCQ format. Skip composition/essay sections.
- ONE correct answer only. No "all of the above" or "none of the above" as options.
- Distractors must be plausible based on common student errors.

## ANSWER KEY BALANCE
Distribute correct answers evenly:
- First 25% of batch: correctOption = "A"
- Second 25% of batch: correctOption = "B"  
- Third 25% of batch: correctOption = "C"
- Final 25% of batch: correctOption = "D"
Then SHUFFLE the final question order in your JSON output so the answers are not grouped.

## SUBJECT FOCUS
${subjectFocus(subjectName)}

## EXPLANATION FIELD
Write a clear 1–2 sentence explanation of WHY the correct answer is correct. 
Make it educational and encouraging for a 12-year-old student.

## OUTPUT FORMAT
Return ONLY raw JSON — no markdown, no backticks, no text before or after.
Start with { and end with }.

{"questions":[{"questionText":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"correctOption":"A","explanation":"..."}]}

## EXAM CONTENT TO BASE TOPICS ON
${rawText.slice(0, 15000)}`;

  let attempt = 0;
  while (attempt < 3) {
    attempt++;
    try {
      console.log(
        `    📡 Gemini — batch ${batch}/${BATCHES_PER_PDF} (attempt ${attempt})...`,
      );

      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini");

      const cleaned = text
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      const parsed = JSON.parse(cleaned);
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("Response missing questions array");
      }

      const valid: ExtractedQuestion[] = [];
      for (const q of parsed.questions) {
        if (
          !q.questionText ||
          !q.options?.A ||
          !q.options?.B ||
          !q.options?.C ||
          !q.options?.D ||
          !["A", "B", "C", "D"].includes(q.correctOption)
        ) {
          console.warn(
            `    ⚠️  Skipping malformed: ${String(q.questionText).slice(0, 50)}`,
          );
          continue;
        }

        valid.push({
          questionText: String(q.questionText).replace(/\n/g, " ").trim(),
          options: {
            A: String(q.options.A).replace(/\n/g, " ").trim(),
            B: String(q.options.B).replace(/\n/g, " ").trim(),
            C: String(q.options.C).replace(/\n/g, " ").trim(),
            D: String(q.options.D).replace(/\n/g, " ").trim(),
          },
          correctOption: q.correctOption,
          explanation: String(q.explanation || "")
            .trim()
            .slice(0, 500),
        });
      }

      // Log answer distribution
      const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
      for (const q of valid) dist[q.correctOption]++;
      const total = valid.length;
      if (total > 0) {
        console.log(
          `    📊 Batch ${batch}: ${total} questions — A:${dist.A} B:${dist.B} C:${dist.C} D:${dist.D}`,
        );
        if (Math.max(...Object.values(dist)) / total > 0.4) {
          console.warn(`    ⚠️  One option > 40% — distribution skewed`);
        }
      }

      return valid;
    } catch (err: any) {
      console.error(`    ❌ Attempt ${attempt} failed: ${err.message}`);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 4000));
      } else {
        throw err;
      }
    }
  }

  return [];
}

// ─── Database Seeding ─────────────────────────────────────────────────────────

async function getOrCreateSubject(subjectName: string): Promise<string> {
  const existing = await db
    .select()
    .from(subjects)
    .where(eq(subjects.name, subjectName))
    .limit(1);

  if (existing[0]) {
    console.log(`  🗂️  Subject exists: "${subjectName}"`);
    return existing[0].id;
  }

  const [created] = await db
    .insert(subjects)
    .values({ name: subjectName })
    .returning();
  console.log(`  🗂️  Created subject: "${subjectName}"`);
  return created.id;
}

async function getOrCreatePack(subjectId: string): Promise<string> {
  const existing = await db
    .select()
    .from(examPacks)
    .where(
      and(
        eq(examPacks.subjectId, subjectId),
        eq(examPacks.packType, PACK_TYPE),
      ),
    )
    .limit(1);

  if (existing[0]) {
    return existing[0].id;
  }

  const [created] = await db
    .insert(examPacks)
    .values({ subjectId, packType: PACK_TYPE, price: PACK_PRICE })
    .returning();
  console.log(`  📦 Created pack: ${PACK_TYPE}`);
  return created.id;
}

async function insertQuestions(
  extracted: ExtractedQuestion[],
  subjectId: string,
  packId: string,
  year: number,
): Promise<void> {
  if (extracted.length === 0) return;

  const rows = extracted.map((q) => ({
    subjectId,
    packId,
    questionText: q.questionText,
    options: q.options,
    correctOption: q.correctOption,
    explanation: q.explanation,
    year,
  }));

  await db.insert(questions).values(rows);
  console.log(`  💾 Inserted ${rows.length} questions (year ${year})`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const inputFolder = path.join(__dirname, "../../data");

  if (!fs.existsSync(inputFolder)) {
    console.error(`❌ Data folder not found: ${inputFolder}`);
    console.error(`   Create it and place PDF files inside named:`);
    console.error(`   YYYY_P6_SubjectName.pdf`);
    console.error(`   e.g. 2023_P6_Mathematics.pdf`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(inputFolder)
    .filter((f) => f.endsWith(".pdf"))
    .sort(); // process in year order

  if (files.length === 0) {
    console.error("❌ No PDF files found in /data folder");
    process.exit(1);
  }

  console.log(`\n📚 Found ${files.length} PDF(s):\n`);
  files.forEach((f) => console.log(`   • ${f}`));
  console.log();

  let totalInserted = 0;

  for (const file of files) {
    const match = file.match(/^(\d{4})_P6_(.+)\.pdf$/);
    if (!match) {
      console.warn(
        `⏭️  Skipping — filename doesn't match YYYY_P6_Name.pdf: ${file}`,
      );
      continue;
    }

    const year = parseInt(match[1]);
    const subjectName = normalizeSubjectName(match[2]);

    console.log(`\n${"═".repeat(60)}`);
    console.log(`📄 ${subjectName} (${year})`);
    console.log(`${"═".repeat(60)}`);

    // Extract PDF text
    let rawText: string;
    try {
      rawText = await extractTextFromPDF(path.join(inputFolder, file));
      console.log(`  📝 Extracted ${rawText.length} characters from PDF`);
    } catch (err: any) {
      console.error(`  ❌ PDF extraction failed: ${err.message}`);
      continue;
    }

    // Get or create subject + pack
    const subjectId = await getOrCreateSubject(subjectName);
    const packId = await getOrCreatePack(subjectId);

    // Generate questions in batches
    const allExtracted: ExtractedQuestion[] = [];

    for (let batch = 1; batch <= BATCHES_PER_PDF; batch++) {
      try {
        const extracted = await extractQuestionsWithGemini(
          rawText,
          subjectName,
          year,
          batch,
        );
        allExtracted.push(...extracted);

        // Pause between batches to be kind to the API
        if (batch < BATCHES_PER_PDF) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      } catch (err: any) {
        console.error(`  ❌ Batch ${batch} failed: ${err.message}`);
      }
    }

    if (allExtracted.length === 0) {
      console.warn(
        `  ⚠️  No questions extracted from ${file} — skipping DB insert`,
      );
      continue;
    }

    // Log overall distribution for this file
    const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const q of allExtracted) dist[q.correctOption]++;
    console.log(
      `\n  📊 Total: ${allExtracted.length} questions — A:${dist.A} B:${dist.B} C:${dist.C} D:${dist.D}`,
    );

    await insertQuestions(allExtracted, subjectId, packId, year);
    totalInserted += allExtracted.length;

    // Pause between files
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`✅ Ingestion complete — ${totalInserted} questions inserted`);
  console.log(`${"═".repeat(60)}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
