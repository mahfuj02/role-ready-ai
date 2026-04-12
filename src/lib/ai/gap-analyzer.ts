import type { GapAnalysisInput, GapAnalysisResult } from "@/lib/ai/types";
import { analyzeGeminiGap } from "@/lib/ai/gemini-gap-analyzer";
import { analyzeMockGap } from "@/lib/ai/mock-gap-analyzer";

export async function analyzeGap(input: GapAnalysisInput): Promise<GapAnalysisResult> {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await analyzeGeminiGap(input);
    } catch {
      return analyzeMockGap(input);
    }
  }

  return analyzeMockGap(input);
}
