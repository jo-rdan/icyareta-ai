import { createContext } from "react";
import { type Question } from "../data/mock";

export interface Answer {
  questionId: string;
  selectedOption: "A" | "B" | "C" | "D";
  isCorrect: boolean;
}

export interface QuizSession {
  subjectId: string;
  subjectName: string;
  packType: string;
  questions: Question[];
  answers: Answer[];
  currentIndex: number;
  isComplete: boolean;
  isTrial: boolean;
}

export interface QuizContextType {
  session: QuizSession | null;
  startQuiz: (
    subjectId: string,
    subjectName: string,
    packType: string,
    isTrial: boolean,
  ) => void;
  submitAnswer: (option: "A" | "B" | "C" | "D") => void;
  resetQuiz: () => void;
  currentQuestion: Question | null;
  score: { correct: number; total: number; percentage: number } | null;
}

export const QuizContext = createContext<QuizContextType | null>(null);
