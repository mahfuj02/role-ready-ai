import type { EvaluateAnswerInput, EvaluationResult, StarResult } from "@/lib/ai/types";
import { detectGeminiStar, evaluateGeminiAnswer } from "@/lib/ai/gemini-answer-evaluator";
import { detectMockStar, evaluateMockAnswer } from "@/lib/ai/mock-answer-evaluator";

export async function evaluateAnswer(input: EvaluateAnswerInput): Promise<EvaluationResult> {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await evaluateGeminiAnswer(input);
    } catch {
      return evaluateMockAnswer(input);
    }
  }

  return evaluateMockAnswer(input);
}

export async function detectStar(answerText: string, questionText: string): Promise<StarResult> {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await detectGeminiStar(answerText, questionText);
    } catch {
      return detectMockStar(answerText);
    }
  }

  return detectMockStar(answerText);
}
