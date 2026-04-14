import type { GapAnalysisInput, GapAnalysisResult } from "@/lib/ai/types";
import { analyzeGroqGap }   from "@/lib/ai/groq-gap-analyzer";
import { analyzeGeminiGap } from "@/lib/ai/gemini-gap-analyzer";
import { analyzeMockGap }   from "@/lib/ai/mock-gap-analyzer";

export async function analyzeGap(input: GapAnalysisInput): Promise<GapAnalysisResult> {
  if (process.env.GROQ_API_KEY) {
    try {
      return await analyzeGroqGap(input);
    } catch (e) {
      console.error("[GROQ_FALLBACK] gap analysis failed:", e);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return await analyzeGeminiGap(input);
    } catch (e) {
      console.error("[GEMINI_FALLBACK] gap analysis failed:", e);
    }
  }

  return analyzeMockGap(input);
}
