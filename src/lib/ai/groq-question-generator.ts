import { z } from "zod";
import type { GenerateQuestionsInput, GeneratedQuestion } from "@/lib/ai/types";
import { groqJson } from "@/lib/ai/groq-client";

const schema = z.object({
  questions: z
    .array(z.object({
      question:       z.string().min(5),
      type:           z.enum(["BEHAVIORAL", "TECHNICAL"]),
      difficulty:     z.enum(["EASY", "MEDIUM", "HARD"]),
      starRecommended: z.boolean(),
    }))
    .min(1),
});

export async function generateGroqQuestions(input: GenerateQuestionsInput): Promise<GeneratedQuestion[]> {
  const total = input.totalQuestions ?? 10;

  const data = await groqJson<unknown>(`You are an expert interview coach.
Generate exactly ${total} interview questions for this candidate.

Rules:
- Mix: ~60% BEHAVIORAL, ~40% TECHNICAL.
- Vary difficulty: some EASY, mostly MEDIUM, some HARD.
- starRecommended: true for behavioral questions where a STAR answer is ideal.
- Questions must be specific to the role, seniority, and the candidate's actual resume — not generic.
- No duplicate or near-duplicate questions.

Return JSON with this exact shape:
{
  "questions": [
    { "question": "...", "type": "BEHAVIORAL", "difficulty": "MEDIUM", "starRecommended": true }
  ]
}

Role: ${input.roleTitle}
Seniority: ${input.seniority}

Resume:
${input.resumeText}

Job Description:
${input.jobDescriptionText}
`);

  const parsed = schema.parse(data);
  return parsed.questions;
}
