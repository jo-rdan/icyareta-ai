export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  questionCount: number;
}

export interface Question {
  id: string;
  subjectId: string;
  packType: "diagnostic" | "daily_drill" | "full_mock";
  questionText: string;
  options: { A: string; B: string; C: string; D: string };
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface ExamResult {
  id: string;
  subjectName: string;
  score: number;
  total: number;
  packType: string;
  takenAt: string;
  weakTopics: string[];
}

export const SUBJECTS: Subject[] = [
  {
    id: "1",
    name: "Mathematics",
    icon: "🔢",
    color: "#1a3f6b",
    questionCount: 120,
  },
  {
    id: "2",
    name: "English Language",
    icon: "📖",
    color: "#6b3a1a",
    questionCount: 120,
  },
  {
    id: "3",
    name: "Science & Technology",
    icon: "🔬",
    color: "#1a6b3c",
    questionCount: 120,
  },
  {
    id: "4",
    name: "Social & Religious Studies",
    icon: "🌍",
    color: "#6b1a4a",
    questionCount: 120,
  },
];

export const MOCK_QUESTIONS: Question[] = [
  {
    id: "q1",
    subjectId: "1",
    packType: "diagnostic",
    questionText: "What is the value of 3/4 + 1/4?",
    options: { A: "1", B: "2/4", C: "4/4", D: "1/2" },
    correctOption: "A",
    explanation:
      "3/4 + 1/4 = 4/4 = 1. When adding fractions with the same denominator, add the numerators.",
  },
  {
    id: "q2",
    subjectId: "1",
    packType: "diagnostic",
    questionText: "How many sides does a hexagon have?",
    options: { A: "5", B: "6", C: "7", D: "8" },
    correctOption: "B",
    explanation: "A hexagon has 6 sides. The prefix 'hex' means six in Greek.",
  },
  {
    id: "q3",
    subjectId: "1",
    packType: "diagnostic",
    questionText: "What is 25% of 200?",
    options: { A: "25", B: "75", C: "50", D: "100" },
    correctOption: "C",
    explanation: "25% of 200 = 25/100 × 200 = 50.",
  },
  {
    id: "q4",
    subjectId: "1",
    packType: "diagnostic",
    questionText: "Which of these is a prime number?",
    options: { A: "9", B: "15", C: "13", D: "21" },
    correctOption: "C",
    explanation: "13 is a prime number — divisible only by 1 and itself.",
  },
  {
    id: "q5",
    subjectId: "1",
    packType: "diagnostic",
    questionText: "What is the perimeter of a square with side 5cm?",
    options: { A: "10 cm", B: "25 cm", C: "15 cm", D: "20 cm" },
    correctOption: "D",
    explanation: "Perimeter of a square = 4 × side = 4 × 5 = 20 cm.",
  },
  {
    id: "q6",
    subjectId: "2",
    packType: "diagnostic",
    questionText: "What is the correct plural of 'child'?",
    options: { A: "childs", B: "childes", C: "children", D: "childer" },
    correctOption: "C",
    explanation:
      "The plural of 'child' is 'children'. This is an irregular plural.",
  },
  {
    id: "q7",
    subjectId: "2",
    packType: "diagnostic",
    questionText: "'The bird sings beautifully.' Which word is a verb?",
    options: { A: "bird", B: "sings", C: "beautifully", D: "the" },
    correctOption: "B",
    explanation:
      "'Sings' is the verb — it describes the action the bird is performing.",
  },
  {
    id: "q8",
    subjectId: "2",
    packType: "diagnostic",
    questionText: "What is the opposite of 'ancient'?",
    options: { A: "old", B: "modern", C: "historic", D: "large" },
    correctOption: "B",
    explanation:
      "The opposite of 'ancient' (very old) is 'modern' (new, current).",
  },
  {
    id: "q9",
    subjectId: "2",
    packType: "diagnostic",
    questionText: "She ______ to school every day.",
    options: { A: "go", B: "gone", C: "goes", D: "going" },
    correctOption: "C",
    explanation:
      "With third person singular (she/he/it), we add 's' to the verb: 'goes'.",
  },
  {
    id: "q10",
    subjectId: "2",
    packType: "diagnostic",
    questionText: "Which sentence uses a question tag correctly?",
    options: {
      A: "It is hot, is it?",
      B: "It is hot, isn't it?",
      C: "It is hot, it isn't?",
      D: "It is hot, it is?",
    },
    correctOption: "B",
    explanation:
      "Question tags use the opposite auxiliary verb. 'It is hot' → 'isn't it?'",
  },
  {
    id: "q11",
    subjectId: "3",
    packType: "diagnostic",
    questionText: "Which organ pumps blood around the body?",
    options: { A: "Lungs", B: "Liver", C: "Kidney", D: "Heart" },
    correctOption: "D",
    explanation:
      "The heart is the muscular organ responsible for pumping blood through the body.",
  },
  {
    id: "q12",
    subjectId: "3",
    packType: "diagnostic",
    questionText: "What do plants need to make their own food?",
    options: {
      A: "Darkness and water",
      B: "Sunlight, water and CO2",
      C: "Soil and oxygen",
      D: "Rain and wind",
    },
    correctOption: "B",
    explanation:
      "Plants make food through photosynthesis using sunlight, water, and carbon dioxide.",
  },
  {
    id: "q13",
    subjectId: "3",
    packType: "diagnostic",
    questionText: "Which state of matter has a definite shape and volume?",
    options: { A: "Gas", B: "Liquid", C: "Solid", D: "Plasma" },
    correctOption: "C",
    explanation: "Solids have both a definite shape and a definite volume.",
  },
  {
    id: "q14",
    subjectId: "3",
    packType: "diagnostic",
    questionText: "What type of energy does the sun produce?",
    options: {
      A: "Chemical energy",
      B: "Nuclear energy",
      C: "Light and heat energy",
      D: "Electrical energy",
    },
    correctOption: "C",
    explanation:
      "The sun produces light energy and heat energy through nuclear fusion.",
  },
  {
    id: "q15",
    subjectId: "3",
    packType: "diagnostic",
    questionText: "Which of these animals is a mammal?",
    options: { A: "Eagle", B: "Crocodile", C: "Salmon", D: "Whale" },
    correctOption: "D",
    explanation:
      "Whales are mammals — warm-blooded, breathe air, and nurse their young with milk.",
  },
  {
    id: "q16",
    subjectId: "4",
    packType: "diagnostic",
    questionText: "What is the capital city of Rwanda?",
    options: { A: "Butare", B: "Gisenyi", C: "Kigali", D: "Ruhengeri" },
    correctOption: "C",
    explanation: "Kigali is the capital and largest city of Rwanda.",
  },
  {
    id: "q17",
    subjectId: "4",
    packType: "diagnostic",
    questionText: "How many provinces does Rwanda have?",
    options: { A: "3", B: "4", C: "5", D: "6" },
    correctOption: "C",
    explanation:
      "Rwanda has 5 provinces: Northern, Southern, Eastern, Western, and Kigali City.",
  },
  {
    id: "q18",
    subjectId: "4",
    packType: "diagnostic",
    questionText: "What does 'Umuganda' refer to in Rwanda?",
    options: {
      A: "Community work",
      B: "Market day",
      C: "School holiday",
      D: "National prayer",
    },
    correctOption: "A",
    explanation:
      "Umuganda is Rwanda's monthly community work day on the last Saturday of each month.",
  },
  {
    id: "q19",
    subjectId: "4",
    packType: "diagnostic",
    questionText: "Which lake borders Rwanda to the west?",
    options: {
      A: "Lake Victoria",
      B: "Lake Tanganyika",
      C: "Lake Kivu",
      D: "Lake Edward",
    },
    correctOption: "C",
    explanation:
      "Lake Kivu forms the western border between Rwanda and the DRC.",
  },
  {
    id: "q20",
    subjectId: "4",
    packType: "diagnostic",
    questionText: "What is the national language of Rwanda?",
    options: { A: "French", B: "Swahili", C: "English", D: "Kinyarwanda" },
    correctOption: "D",
    explanation:
      "Kinyarwanda is the national language spoken by virtually all Rwandans.",
  },
];

export const MOCK_RESULTS: ExamResult[] = [
  {
    id: "r1",
    subjectName: "Mathematics",
    score: 3,
    total: 5,
    packType: "diagnostic",
    takenAt: "2026-03-20T10:30:00Z",
    weakTopics: ["Fractions", "Geometry"],
  },
  {
    id: "r2",
    subjectName: "English Language",
    score: 4,
    total: 5,
    packType: "diagnostic",
    takenAt: "2026-03-19T14:15:00Z",
    weakTopics: ["Question tags"],
  },
];

export const SUBJECT_WEAK_TOPICS: Record<string, string[]> = {
  "1": ["Fractions", "Geometry", "Percentages"],
  "2": ["Question tags", "Verb tenses", "Plurals"],
  "3": ["Human body systems", "Energy types", "States of matter"],
  "4": ["Rwanda geography", "Civic education", "Religious studies"],
};
