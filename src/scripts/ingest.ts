import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import { GoogleGenAI } from "@google/genai";
import { db } from "../db";
import { questions, subjects, examPacks } from "../db/schema";
import * as dotenv from "dotenv";
import { eq, and } from "drizzle-orm";

dotenv.config();

// ─── Constants ────────────────────────────────────────────────────────────────

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const PACK_CONFIGS = [
  {
    packType: "diagnostic" as const,
    price: 500,
    label: "Bronze / Diagnostic",
    difficulty: "straightforward recall",
    instruction:
      "RECALL ONLY. Student recognises the answer from memory. Direct questions like 'What is X?' or 'Which of these is Y?'. Options are short single words or short phrases. No calculations required.",
  },
  {
    packType: "daily_drill" as const,
    price: 1000,
    label: "Silver / Daily Drill",
    difficulty: "application and understanding",
    instruction:
      "APPLICATION. Student must apply a concept, complete a simple calculation, or identify a concept used in a sentence or scenario. Distractors are plausible common mistakes students make.",
  },
  {
    packType: "full_mock" as const,
    price: 2000,
    label: "Gold / Full Mock",
    difficulty: "multi-step reasoning",
    instruction:
      "MULTI-STEP REASONING. Student must combine two ideas, reason from a scenario, or perform a multi-step calculation. Distractors are near-misses from wrong intermediate steps.",
  },
];

const MAX_Q_CHARS = 90;
const MAX_OPT_CHARS = 28;

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

// ─── Gemini Extraction ────────────────────────────────────────────────────────

interface ExtractedQuestion {
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
}

async function extractQuestionsWithGemini(
  rawText: string,
  subjectName: string,
  year: number,
  packConfig: (typeof PACK_CONFIGS)[number],
): Promise<ExtractedQuestion[]> {
  // Two batches of 20 = ~40 questions per pack
  // Splitting into batches improves answer distribution and avoids context limits
  const allQuestions: ExtractedQuestion[] = [];

  for (const batch of [1, 2]) {
    const prompt = `You are generating quiz questions for a USSD mobile app for Rwandan P6 students on basic feature phones. USSD screens are tiny. Every constraint below is ABSOLUTE — violations break the app.

## TASK
Generate exactly 20 multiple-choice questions.
Subject: ${subjectName}
Year: ${year}
Pack: ${packConfig.label}
Difficulty: ${packConfig.difficulty}
Batch: ${batch} of 2 — generate DIFFERENT questions from batch 1, no repeats.

## DIFFICULTY INSTRUCTION
${packConfig.instruction}

## ABSOLUTE CHARACTER LIMITS — COUNT EVERY CHARACTER
- questionText: MAX 90 characters. Count spaces too. No newlines.
- Each option value: MAX 28 characters. Count spaces too. No newlines.
- Keys must be exactly: "A", "B", "C", "D"
- correctOption must be exactly one of: "A", "B", "C", "D"

## ANSWER KEY BALANCE — YOU MUST FOLLOW THIS EXACTLY
Distribute correct answers across all 20 questions like this:
- Questions 1–5: correctOption = "A"
- Questions 6–10: correctOption = "B"
- Questions 11–15: correctOption = "C"
- Questions 16–20: correctOption = "D"
Then shuffle the order of questions in your output so they are NOT grouped by answer.
This ensures exactly 25% per option.

## QUESTION RULES
1. SELF-CONTAINED: No "according to the passage/text/story". Student has not read any passage.
2. ONE CORRECT ANSWER ONLY: Only one option is unambiguously correct.
3. NO "all of the above" or "none of the above" as options.
4. Maths: solve the problem yourself first, verify the answer, THEN write the question and distractors.
5. English: convert fill-in-the-blank into MCQ format. Skip composition/essay section entirely.

## SUBJECT FOCUS
${
  subjectName === "Mathematics"
    ? "Cover: integers, fractions, decimals, percentages, geometry, statistics, ratio, time, measurement, algebra. Include word problems."
    : subjectName === "English Language"
      ? "Cover: vocabulary, grammar (pronouns, verb tenses, conjunctions, question tags), reading comprehension concepts. Convert blanks to MCQ."
      : subjectName.includes("Science")
        ? "Cover: living things, plants, animals, human body systems, sound, light, electricity, materials, farming tools, technology."
        : "Cover: Rwanda geography, history, civic education, health, cooperative societies, leadership, religious studies facts."
}

## OUTPUT FORMAT
Return ONLY raw JSON. No markdown. No backticks. No text before or after. Start your response with { and end with }.

{"questions":[{"questionText":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"correctOption":"A","explanation":"..."}]}

## EXAM CONTENT
${rawText.slice(0, 15000)}`;

    let attempt = 0;
    while (attempt < 3) {
      attempt++;
      try {
        console.log(
          `    📡 Gemini — ${packConfig.label} batch ${batch}/2 (attempt ${attempt})...`,
        );

        const response = await genAI.models.generateContent({
          model: "gemini-2.5-flash",
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

        let batchCount = 0;
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
              `    ⚠️  Skipping malformed: ${String(q.questionText).slice(0, 40)}`,
            );
            continue;
          }

          allQuestions.push({
            questionText: String(q.questionText)
              .replace(/\n/g, " ")
              .slice(0, MAX_Q_CHARS),
            options: {
              A: String(q.options.A)
                .replace(/\n/g, " ")
                .slice(0, MAX_OPT_CHARS),
              B: String(q.options.B)
                .replace(/\n/g, " ")
                .slice(0, MAX_OPT_CHARS),
              C: String(q.options.C)
                .replace(/\n/g, " ")
                .slice(0, MAX_OPT_CHARS),
              D: String(q.options.D)
                .replace(/\n/g, " ")
                .slice(0, MAX_OPT_CHARS),
            },
            correctOption: q.correctOption,
            explanation: String(q.explanation || "").slice(0, 300),
          });
          batchCount++;
        }

        console.log(`    ✅ Batch ${batch}: ${batchCount} valid questions`);
        break;
      } catch (err: any) {
        console.error(`    ❌ Attempt ${attempt} failed: ${err.message}`);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 4000));
        } else {
          throw err;
        }
      }
    }

    if (batch === 1) await new Promise((r) => setTimeout(r, 3000));
  }

  // Log final distribution
  const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of allQuestions) dist[q.correctOption]++;
  const total = allQuestions.length;
  console.log(
    `    📊 Distribution — A:${dist.A}(${((dist.A / total) * 100).toFixed(0)}%) B:${dist.B}(${((dist.B / total) * 100).toFixed(0)}%) C:${dist.C}(${((dist.C / total) * 100).toFixed(0)}%) D:${dist.D}(${((dist.D / total) * 100).toFixed(0)}%)`,
  );
  if (Math.max(...Object.values(dist)) / total > 0.4) {
    console.warn(`    ⚠️  Distribution still skewed > 40% on one option.`);
  }

  return allQuestions;
}

// ─── Database Seeding ─────────────────────────────────────────────────────────

async function seedPack(
  extractedQuestions: ExtractedQuestion[],
  subjectId: string,
  packConfig: (typeof PACK_CONFIGS)[number],
  year: number,
): Promise<void> {
  const packResult = await db
    .select()
    .from(examPacks)
    .where(
      and(
        eq(examPacks.subjectId, subjectId),
        eq(examPacks.packType, packConfig.packType),
      ),
    )
    .limit(1);

  let packId = packResult[0]?.id;
  if (!packId) {
    const [newPack] = await db
      .insert(examPacks)
      .values({
        subjectId,
        packType: packConfig.packType,
        price: packConfig.price,
      })
      .returning();
    packId = newPack.id;
    console.log(
      `    📦 Created pack: ${packConfig.label} (${packConfig.price} RWF)`,
    );
  }

  const toInsert = extractedQuestions.map((q) => ({
    subjectId,
    packId,
    questionText: q.questionText,
    options: q.options,
    correctOption: q.correctOption,
    explanation: q.explanation,
    year,
  }));

  if (toInsert.length > 0) {
    await db.insert(questions).values(toInsert);
    console.log(
      `    💾 Inserted ${toInsert.length} questions → ${packConfig.label}`,
    );
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const inputFolder = path.join(__dirname, "../../data");

  if (!fs.existsSync(inputFolder)) {
    console.error(`❌ Data folder not found: ${inputFolder}`);
    process.exit(1);
  }

  const files = fs.readdirSync(inputFolder).filter((f) => f.endsWith(".pdf"));

  if (files.length === 0) {
    console.error("❌ No PDF files found in /data folder");
    process.exit(1);
  }

  console.log(`\n📚 Found ${files.length} PDF(s): ${files.join(", ")}\n`);

  for (const file of files) {
    const filenameMatch = file.match(/^(\d{4})_P6_(.+)\.pdf$/);
    if (!filenameMatch) {
      console.warn(`⏭️  Skipping unrecognised filename: ${file}`);
      continue;
    }

    const year = parseInt(filenameMatch[1]);
    const subjectName = normalizeSubjectName(filenameMatch[2]);

    console.log(`\n${"═".repeat(60)}`);
    console.log(`📄 ${subjectName} (${year})`);
    console.log(`${"═".repeat(60)}`);

    let rawText: string;
    try {
      rawText = await extractTextFromPDF(path.join(inputFolder, file));
      console.log(`  📝 PDF text: ${rawText.length} chars`);
    } catch (err: any) {
      console.error(`  ❌ PDF extraction failed: ${err.message}`);
      continue;
    }

    // Get or create subject
    let subjectResult = await db
      .select()
      .from(subjects)
      .where(eq(subjects.name, subjectName))
      .limit(1);

    let subjectId = subjectResult[0]?.id;
    if (!subjectId) {
      const [newSub] = await db
        .insert(subjects)
        .values({ name: subjectName })
        .returning();
      subjectId = newSub.id;
      console.log(`  🗂️  Created subject: "${subjectName}"`);
    } else {
      console.log(`  🗂️  Using subject: "${subjectName}"`);
    }

    // Process all 3 packs
    for (const packConfig of PACK_CONFIGS) {
      console.log(`\n  🎯 ${packConfig.label}...`);
      try {
        const extracted = await extractQuestionsWithGemini(
          rawText,
          subjectName,
          year,
          packConfig,
        );

        if (extracted.length === 0) {
          console.warn(`  ⚠️  No valid questions extracted — skipping`);
          continue;
        }

        await seedPack(extracted, subjectId, packConfig, year);
        await new Promise((r) => setTimeout(r, 3000));
      } catch (err: any) {
        console.error(`  ❌ ${packConfig.label} failed: ${err.message}`);
      }
    }
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`✅ Ingestion complete`);
  console.log(`${"═".repeat(60)}\n`);
  process.exit(0);
}

main();
