import { z } from "zod";
import type { GenerateQuestionsInput, GeneratedQuestion } from "@/lib/ai/types";
import { extractJsonPayload, getGeminiClient, getGeminiModel } from "@/lib/ai/gemini-client";

const schema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(5),
        type: z.enum(["BEHAVIORAL", "TECHNICAL"]),
        difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
        starRecommended: z.boolean(),
      }),
    )
    .min(1),
});

export async function generateGeminiQuestions(input: GenerateQuestionsInput): Promise<GeneratedQuestion[]> {
  const client = getGeminiClient();

  if (!client) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const total = input.totalQuestions ?? 10;

  const prompt = `You are an expert interview coach.
Generate exactly ${total} interview questions for this target role.

Rules:
- Return valid JSON only.
- No markdown or code fences.
- Use this schema exactly:
{
  "questions": [
    {
      "question": "...",
      "type": "BEHAVIORAL" | "TECHNICAL",
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "starRecommended": true | false
    }
  ]
}
- Behavioral ratio should be close to 0.6.
- Questions must be non-repetitive and role-specific.

Role title: ${input.roleTitle}
Seniority: ${input.seniority}
Resume:
${input.resumeText}

Job description:
${input.jobDescriptionText}
`;

  const response = await client.models.generateContent({
    model: getGeminiModel(),
    contents: prompt,
  });

  const raw = response.text ?? "";
  const parsedJson = JSON.parse(extractJsonPayload(raw));
  const parsed = schema.parse(parsedJson);

  return parsed.questions;
}
