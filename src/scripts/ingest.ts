import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import { GoogleGenAI } from "@google/genai";
import { db } from "../db";
import { questions, subjects, examPacks } from "../db/schema";
import * as dotenv from "dotenv";
import { eq, and } from "drizzle-orm";

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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

async function structureDataWithGemini(
  rawText: string,
  subjectName: string,
  year: number,
) {
  const prompt = `
    Analyze the following raw text extracted from a Rwandan P6 National Exam PDF for subject: ${subjectName}, Year: ${year}.
    Convert it into a structured JSON array of question objects based on the schema below.

    ### SCHEMA:
    - questionText: The text of the question (STRICT MAX 100 chars for USSD).
    - options: A JSON object where keys are (A, B, C, D) and values are option texts (MAX 30 chars).
    - correctOption: The KEY of the correct option (e.g., "C").
    - explanation: A brief explanation.

    ### CRITICAL FIXES & RULES:
    1. **STANDALONE ONLY**: Remove ALL references to "the passage," "the story," or "the text." Rewrite questions to be self-contained.
    2. **MATH COMPARISON LOGIC**: For comparison questions (e.g., 10^6 vs 1,000,000), options A, B, and C MUST be "<", ">", and "=". The 'correctOption' must point to the mathematically true symbol.
    3. **VOLUME & CONVERSION**: Extract 30-40 questions. Convert short-answers into MCQs by generating 3 plausible distractors.
    4. **SHUFFLE CORRECT KEY**: Do not default to "A". Distribute correct answers randomly across A, B, C, and D.
    5. **NO MULTIPLE TRUTHS**: Ensure only one option is correct. Avoid overlapping answers.
    6. **USSD CONSTRAINTS**: If questionText exceeds 100 chars, truncate or simplify it. Ensure no newlines.

    ### SUBJECT SPECIFIC:
    ${
      subjectName === "Mathematics"
        ? `- Solve math internally first. If the original text lacks options, create 4 based on common errors.`
        : `- For English, convert "Fill in the blank" into MCQs. Ignore composition and long essays.`
    }

    Output Format:
    {
      "questions": [
        {
          "questionText": "...",
          "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
          "correctOption": "...",
          "explanation": "..."
        }
      ]
    }

    Raw Text:
    ${rawText.slice(0, 20000)}
`;

  // --- UPDATED FOR @google/genai ---

  // 1. Use the new syntax: ai.models.generateContent
  const responsePromise = await genAI.models.generateContent({
    model: "gemini-2.5-flash", // Using the correct model name
    contents: prompt,
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Gemini API request timed out")), 30000),
  );

  // 4. Race them
  const response = (await Promise.race([
    responsePromise,
    timeoutPromise,
  ])) as any;

  // 2. Access text directly from the response object
  const text = response.text;

  // --- END UPDATED SECTION ---

  if (!text) {
    throw new Error(
      `Failed to get response text from Gemini for ${subjectName} ${year}`,
    );
  }

  const cleanedText = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(cleanedText);
}

// ... existing imports ...

async function seedDatabase(
  structuredQuestions: any[],
  subjectName: string,
  year: number,
) {
  // 1. Get/Create Subject
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
  }

  // 2. Get/Create Exam Pack
  let packResult = await db
    .select()
    .from(examPacks)
    .where(eq(examPacks.subjectId, subjectId))
    .limit(1);
  let packId = packResult[0]?.id;
  if (!packId) {
    const [newPack] = await db
      .insert(examPacks)
      .values({
        subjectId,
        packType: "diagnostic",
        price: 500,
      })
      .returning();
    packId = newPack.id;
  }

  // 3. Map to JSONB Schema
  const questionsToInsert = structuredQuestions.map((q) => ({
    subjectId,
    packId,
    questionText: q.questionText,
    options: q.options, // This is the new JSONB field
    correctOption: q.correctOption, // Now stores "A", "B", "C", or "D"
    explanation: q.explanation || "",
    year: year,
  }));

  if (questionsToInsert.length > 0) {
    await db.insert(questions).values(questionsToInsert);
    console.log(
      `✅ Successfully seeded ${questionsToInsert.length} questions for ${subjectName}`,
    );
  }
}

async function main() {
  const inputFolder = path.join(__dirname, "../../data");
  const files = fs.readdirSync(inputFolder);

  for (const file of files) {
    if (file.endsWith(".pdf")) {
      const filePath = path.join(inputFolder, file);
      // Fixed Regex (single backslashes)
      const filenameMatch = file.match(/^(\d{4})_P6_(.+)\.pdf$/);

      if (!filenameMatch) continue;

      const year = parseInt(filenameMatch[1]);
      const subjectName = filenameMatch[2].replace(/_/g, " ");

      console.log(`🚀 Processing: ${subjectName} (${year})`);

      try {
        const rawText = await extractTextFromPDF(filePath);
        const structuredData = await structureDataWithGemini(
          rawText,
          subjectName,
          year,
        );

        // Ensure we pass the array from the JSON object
        if (structuredData.questions) {
          await seedDatabase(structuredData.questions, subjectName, year);
        }
      } catch (error) {
        console.error(`❌ Error in ${file}:`, error);
      }
    }
  }
  process.exit(0);
}

main();
