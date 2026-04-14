import type { GenerateQuestionsInput, GeneratedQuestion } from "@/lib/ai/types";
import { generateGroqQuestions }   from "@/lib/ai/groq-question-generator";
import { generateGeminiQuestions } from "@/lib/ai/gemini-question-generator";
import { generateMockQuestions }   from "@/lib/ai/mock-question-generator";

export async function generateQuestions(input: GenerateQuestionsInput): Promise<GeneratedQuestion[]> {
  if (process.env.GROQ_API_KEY) {
    try {
      return await generateGroqQuestions(input);
    } catch (e) {
      console.error("[GROQ_FALLBACK] question generation failed:", e);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return await generateGeminiQuestions(input);
    } catch (e) {
      console.error("[GEMINI_FALLBACK] question generation failed:", e);
    }
  }

  return generateMockQuestions(input);
}
