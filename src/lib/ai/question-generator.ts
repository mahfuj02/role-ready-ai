import type { GenerateQuestionsInput, GeneratedQuestion } from "@/lib/ai/types";
import { generateGeminiQuestions } from "@/lib/ai/gemini-question-generator";
import { generateMockQuestions } from "@/lib/ai/mock-question-generator";

export async function generateQuestions(input: GenerateQuestionsInput): Promise<GeneratedQuestion[]> {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await generateGeminiQuestions(input);
    } catch {
      return generateMockQuestions(input);
    }
  }

  return generateMockQuestions(input);
}
