import type {
  EvaluateAnswerInput,
  EvaluationResult,
  EvaluationWithSource,
  StarResult,
  StarWithSource,
} from "@/lib/ai/types";
import { evaluateGroqAnswer, detectGroqStar }     from "@/lib/ai/groq-answer-evaluator";
import { evaluateGeminiAnswer, detectGeminiStar } from "@/lib/ai/gemini-answer-evaluator";
import { evaluateMockAnswer, detectMockStar }     from "@/lib/ai/mock-answer-evaluator";

export async function evaluateAnswer(input: EvaluateAnswerInput): Promise<EvaluationResult> {
  return (await evaluateAnswerWithSource(input)).result;
}

export async function evaluateAnswerWithSource(input: EvaluateAnswerInput): Promise<EvaluationWithSource> {
  if (process.env.GROQ_API_KEY) {
    try {
      return { provider: "GEMINI", result: await evaluateGroqAnswer(input) };
    } catch (e) {
      console.error("[GROQ_FALLBACK] answer evaluation failed:", e);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return { provider: "GEMINI", result: await evaluateGeminiAnswer(input) };
    } catch (e) {
      console.error("[GEMINI_FALLBACK] answer evaluation failed:", e);
    }
  }

  return { provider: "MOCK", result: evaluateMockAnswer(input) };
}

export async function detectStar(answerText: string, questionText: string): Promise<StarResult> {
  return (await detectStarWithSource(answerText, questionText)).result;
}

export async function detectStarWithSource(answerText: string, questionText: string): Promise<StarWithSource> {
  if (process.env.GROQ_API_KEY) {
    try {
      return { provider: "GEMINI", result: await detectGroqStar(answerText, questionText) };
    } catch (e) {
      console.error("[GROQ_FALLBACK] STAR detection failed:", e);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return { provider: "GEMINI", result: await detectGeminiStar(answerText, questionText) };
    } catch (e) {
      console.error("[GEMINI_FALLBACK] STAR detection failed:", e);
    }
  }

  return { provider: "MOCK", result: detectMockStar(answerText) };
}
