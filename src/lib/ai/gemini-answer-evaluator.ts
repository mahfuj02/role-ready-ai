import { z } from "zod";
import type { EvaluateAnswerInput, EvaluationResult, StarResult } from "@/lib/ai/types";
import { extractJsonPayload, getGeminiClient, getGeminiModel } from "@/lib/ai/gemini-client";

const starSchema = z.object({
  situation: z.object({ present: z.boolean(), evidence: z.string() }),
  task: z.object({ present: z.boolean(), evidence: z.string() }),
  action: z.object({ present: z.boolean(), evidence: z.string() }),
  result: z.object({ present: z.boolean(), evidence: z.string() }),
  missingParts: z.array(z.enum(["situation", "task", "action", "result"])).catch([]),
  coachTip: z.string().min(1).catch("Focus on STAR structure in future answers"),
});

const evalSchema = z.object({
  scores: z.object({
    relevance: z.number().min(0).max(5),
    clarity: z.number().min(0).max(5),
    depth: z.number().min(0).max(5),
    communication: z.number().min(0).max(5),
  }),
  reasons: z.object({
    relevance: z.string().min(1).catch("Good relevance to the role"),
    clarity: z.string().min(1).catch("Clear communication"),
    depth: z.string().min(1).catch("Good depth of analysis"),
    communication: z.string().min(1).catch("Good communication skills"),
  }),
  improvementTips: z
    .array(z.string().min(1))
    .min(1)
    .max(3)
    .catch(["Build deeper technical knowledge", "Practice clear articulation"]),
  improvedAnswer: z.string().min(10).catch("Practice refining your answer with more specific examples"),
  star: starSchema.optional(),
});

export async function evaluateGeminiAnswer(input: EvaluateAnswerInput): Promise<EvaluationResult> {
  const client = getGeminiClient();

  if (!client) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const prompt = `You are a strict but supportive interview evaluator.
Return JSON only.

Score the answer from 0 to 5 for:
- relevance
- clarity
- depth
- communication

If the question is behavioral, also analyze STAR structure.

Return this schema exactly:
{
  "scores": {"relevance": 0, "clarity": 0, "depth": 0, "communication": 0},
  "reasons": {"relevance": "...", "clarity": "...", "depth": "...", "communication": "..."},
  "improvementTips": ["...", "..."],
  "improvedAnswer": "...",
  "star": {
    "situation": {"present": true, "evidence": "..."},
    "task": {"present": true, "evidence": "..."},
    "action": {"present": true, "evidence": "..."},
    "result": {"present": true, "evidence": "..."},
    "missingParts": ["task"],
    "coachTip": "..."
  }
}

Role: ${input.roleTitle}
Question type: ${input.questionType}
Question: ${input.question}
Candidate answer: ${input.answerText}
Resume: ${input.resumeText}
Job description: ${input.jobDescriptionText}
${input.questionType === "BEHAVIORAL" ? "This is a behavioral question. Fill the star object too." : "This is a technical question. Omit star or return an empty star object if needed."}
`;

  const response = await client.models.generateContent({
    model: getGeminiModel(),
    contents: prompt,
  });

  const raw = response.text ?? "";
  const parsedJson = JSON.parse(extractJsonPayload(raw));
  const parsed = evalSchema.parse(parsedJson);

  return {
    scores: {
      relevance: Math.round(parsed.scores.relevance),
      clarity: Math.round(parsed.scores.clarity),
      depth: Math.round(parsed.scores.depth),
      communication: Math.round(parsed.scores.communication),
    },
    reasons: parsed.reasons,
    improvementTips: parsed.improvementTips,
    improvedAnswer: parsed.improvedAnswer,
    star: parsed.star,
  };
}

export async function detectGeminiStar(answerText: string, question: string): Promise<StarResult> {
  const client = getGeminiClient();

  if (!client) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const prompt = `You are an interview coach checking STAR structure.
Return JSON only.

Question: ${question}
Answer: ${answerText}

Return this schema exactly:
{
  "situation": {"present": true, "evidence": "..."},
  "task": {"present": true, "evidence": "..."},
  "action": {"present": true, "evidence": "..."},
  "result": {"present": true, "evidence": "..."},
  "missingParts": ["task"],
  "coachTip": "..."
}
`;

  const response = await client.models.generateContent({
    model: getGeminiModel(),
    contents: prompt,
  });

  const raw = response.text ?? "";
  const parsedJson = JSON.parse(extractJsonPayload(raw));
  return starSchema.parse(parsedJson);
}
