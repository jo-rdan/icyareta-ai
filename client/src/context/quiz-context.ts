import { createContext } from "react";

export interface Answer {
  questionId: string;
  selectedOption: "A" | "B" | "C" | "D";
  isCorrect: boolean;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface ActiveQuestion {
  id: string;
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctOption?: string;
  index: number;
  total: number;
}

export interface QuizSession {
  sessionId: string;
  subjectId: string;
  subjectName: string;
  packType: string;
  isTrial: boolean;
  currentQuestion: ActiveQuestion | null;
  answers: Answer[];
  isComplete: boolean;
  score: {
    correct: number;
    total: number;
    percentage: number;
    display: string;
  } | null;
}

interface QuizContextType {
  session: QuizSession | null;
  isLoading: boolean;
  error: string | null;
  startQuiz: (
    subjectId: string,
    subjectName: string,
    packType: string,
    isTrial: boolean,
  ) => Promise<void>;
  submitAnswer: (option: "A" | "B" | "C" | "D") => Promise<void>;
  resetQuiz: () => void;
}

export const QuizContext = createContext<QuizContextType | null>(null);
