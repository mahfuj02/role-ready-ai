import type {
  EvaluateAnswerInput,
  EvaluationResult,
  EvaluationWithSource,
  StarResult,
  StarWithSource,
} from "@/lib/ai/types";
import { detectGeminiStar, evaluateGeminiAnswer } from "@/lib/ai/gemini-answer-evaluator";
import { detectMockStar, evaluateMockAnswer } from "@/lib/ai/mock-answer-evaluator";

export async function evaluateAnswer(input: EvaluateAnswerInput): Promise<EvaluationResult> {
  const evaluated = await evaluateAnswerWithSource(input);
  return evaluated.result;
}

export async function evaluateAnswerWithSource(
  input: EvaluateAnswerInput,
): Promise<EvaluationWithSource> {
  if (process.env.GEMINI_API_KEY) {
    try {
      return {
        provider: "GEMINI",
        result: await evaluateGeminiAnswer(input),
      };
    } catch (error) {
      console.error(
        "[GEMINI_FALLBACK] Evaluation failed:",
        error instanceof Error ? error.message : String(error),
      );
      return {
        provider: "MOCK",
        result: evaluateMockAnswer(input),
      };
    }
  }

  return {
    provider: "MOCK",
    result: evaluateMockAnswer(input),
  };
}

export async function detectStar(answerText: string, questionText: string): Promise<StarResult> {
  const detected = await detectStarWithSource(answerText, questionText);
  return detected.result;
}

export async function detectStarWithSource(
  answerText: string,
  questionText: string,
): Promise<StarWithSource> {
  if (process.env.GEMINI_API_KEY) {
    try {
      return {
        provider: "GEMINI",
        result: await detectGeminiStar(answerText, questionText),
      };
    } catch (error) {
      console.error(
        "[GEMINI_FALLBACK] STAR detection failed:",
        error instanceof Error ? error.message : String(error),
      );
      return {
        provider: "MOCK",
        result: detectMockStar(answerText),
      };
    }
  }

  return {
    provider: "MOCK",
    result: detectMockStar(answerText),
  };
}
