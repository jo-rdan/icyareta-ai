/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { QuizContext, type Answer, type QuizSession } from "./quiz-context";
import api from "@/lib/axios";

export type { Answer, QuizSession } from "./quiz-context";

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startQuiz = async (
    subjectId: string,
    subjectName: string,
    packType: string,
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/quiz/start", {
        subjectId,
        packType,
      });

      setSession({
        sessionId: data.sessionId,
        subjectId,
        subjectName,
        packType,
        isTrial: data.isTrial,
        currentQuestion: {
          id: data.question.id,
          text: data.question.text,
          options: data.question.options,
          index: data.currentIndex,
          total: data.total,
        },
        answers: [],
        isComplete: false,
        score: null,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async (option: "A" | "B" | "C" | "D") => {
    if (!session) return;
    setIsLoading(true);
    try {
      const { data } = await api.post("/quiz/answer", {
        sessionId: session.sessionId,
        selectedOption: option,
      });

      const newAnswer: Answer = {
        questionId: session.currentQuestion!.id,
        selectedOption: option,
        isCorrect: data.answer.isCorrect,
        correctOption: data.answer.correctOption,
        explanation: data.answer.explanation,
      };

      if (data.complete) {
        setSession((s) =>
          s
            ? {
                ...s,
                answers: [...s.answers, newAnswer],
                isComplete: true,
                currentQuestion: null,
                score: data.score,
              }
            : s,
        );
      } else {
        setSession((s) =>
          s
            ? {
                ...s,
                answers: [...s.answers, newAnswer],
                currentQuestion: {
                  id: data.nextQuestion.id,
                  text: data.nextQuestion.text,
                  options: data.nextQuestion.options,
                  index: data.nextQuestion.index,
                  total: data.nextQuestion.total,
                },
              }
            : s,
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit answer");
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuiz = () => {
    setSession(null);
    setError(null);
  };

  return (
    <QuizContext.Provider
      value={{ session, isLoading, error, startQuiz, submitAnswer, resetQuiz }}
    >
      {children}
    </QuizContext.Provider>
  );
}
