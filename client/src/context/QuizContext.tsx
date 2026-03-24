import React, { useState } from "react";
import { MOCK_QUESTIONS } from "../data/mock";
import { QuizContext, type QuizSession } from "./quiz-context";

export type { Answer, QuizSession } from "./quiz-context";

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<QuizSession | null>(null);

  const startQuiz = (
    subjectId: string,
    subjectName: string,
    packType: string,
    isTrial: boolean,
  ) => {
    const pool = MOCK_QUESTIONS.filter(
      (q) => q.subjectId === subjectId && q.packType === "diagnostic",
    );
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const count = isTrial
      ? 5
      : packType === "daily_drill"
        ? 8
        : packType === "full_mock"
          ? 12
          : 5;
    const questions = shuffled.slice(0, Math.min(count, shuffled.length));

    setSession({
      subjectId,
      subjectName,
      packType,
      questions,
      answers: [],
      currentIndex: 0,
      isComplete: false,
      isTrial,
    });
  };

  const submitAnswer = (option: "A" | "B" | "C" | "D") => {
    if (!session) return;
    const question = session.questions[session.currentIndex];
    const isCorrect = option === question.correctOption;
    const newAnswers = [
      ...session.answers,
      { questionId: question.id, selectedOption: option, isCorrect },
    ];
    const nextIndex = session.currentIndex + 1;
    const isComplete = nextIndex >= session.questions.length;
    setSession({
      ...session,
      answers: newAnswers,
      currentIndex: isComplete ? session.currentIndex : nextIndex,
      isComplete,
    });
  };

  const resetQuiz = () => setSession(null);

  const currentQuestion =
    session && !session.isComplete
      ? session.questions[session.currentIndex]
      : null;

  const score = session?.isComplete
    ? {
        correct: session.answers.filter((a) => a.isCorrect).length,
        total: session.questions.length,
        percentage: Math.round(
          (session.answers.filter((a) => a.isCorrect).length /
            session.questions.length) *
            100,
        ),
      }
    : null;

  return (
    <QuizContext.Provider
      value={{
        session,
        startQuiz,
        submitAnswer,
        resetQuiz,
        currentQuestion,
        score,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}
