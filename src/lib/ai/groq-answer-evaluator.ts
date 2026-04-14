import { z } from "zod";
import type { EvaluateAnswerInput, EvaluationResult, StarResult } from "@/lib/ai/types";
import { groqJson } from "@/lib/ai/groq-client";

const starSchema = z.object({
  situation: z.object({ present: z.boolean(), evidence: z.string() }),
  task:      z.object({ present: z.boolean(), evidence: z.string() }),
  action:    z.object({ present: z.boolean(), evidence: z.string() }),
  result:    z.object({ present: z.boolean(), evidence: z.string() }),
  missingParts: z.array(z.enum(["situation", "task", "action", "result"])).catch([]),
  coachTip: z.string().min(1).catch("Focus on STAR structure in your next answer."),
});

const evalSchema = z.object({
  scores: z.object({
    relevance:     z.number().min(0).max(5),
    clarity:       z.number().min(0).max(5),
    depth:         z.number().min(0).max(5),
    communication: z.number().min(0).max(5),
  }),
  reasons: z.object({
    relevance:     z.string().min(1).catch("Good relevance to the role"),
    clarity:       z.string().min(1).catch("Clear communication"),
    depth:         z.string().min(1).catch("Good depth of analysis"),
    communication: z.string().min(1).catch("Good communication skills"),
  }),
  improvementTips: z.array(z.string().min(1)).min(1).max(3)
    .catch(["Practice articulating examples more concisely"]),
  improvedAnswer: z.string().min(10)
    .catch("Refine your answer with a specific, structured example."),
  star: starSchema.optional(),
});

export async function evaluateGroqAnswer(input: EvaluateAnswerInput): Promise<EvaluationResult> {
  const isBehavioral = input.questionType === "BEHAVIORAL";

  const data = await groqJson<unknown>(`You are a strict but supportive interview coach evaluating a candidate's answer.

Score each dimension from 0 to 5 (integers only):
- relevance: how well the answer addresses the specific question and role
- clarity: structure, conciseness, and ease of understanding
- depth: specificity, examples, and technical/situational detail
- communication: professional tone, vocabulary, and delivery

${isBehavioral ? `Also analyze STAR structure (Situation / Task / Action / Result).
For each part: was it present? Quote the evidence from the answer.
List any missing parts. Give one actionable coachTip.` : "This is a technical question — omit the star field."}

Return JSON with this exact shape:
{
  "scores":  { "relevance": 0, "clarity": 0, "depth": 0, "communication": 0 },
  "reasons": { "relevance": "...", "clarity": "...", "depth": "...", "communication": "..." },
  "improvementTips": ["...", "..."],
  "improvedAnswer": "A model answer the candidate should aim for..."${isBehavioral ? `,
  "star": {
    "situation": { "present": true, "evidence": "..." },
    "task":      { "present": true, "evidence": "..." },
    "action":    { "present": true, "evidence": "..." },
    "result":    { "present": true, "evidence": "..." },
    "missingParts": [],
    "coachTip": "..."
  }` : ""}
}

Role: ${input.roleTitle}
Question type: ${input.questionType}
Question: ${input.question}
Candidate answer: ${input.answerText}
Resume summary: ${input.resumeText.slice(0, 800)}
Job description summary: ${input.jobDescriptionText.slice(0, 800)}
`);

  const parsed = evalSchema.parse(data);

  return {
    scores: {
      relevance:     Math.round(parsed.scores.relevance),
      clarity:       Math.round(parsed.scores.clarity),
      depth:         Math.round(parsed.scores.depth),
      communication: Math.round(parsed.scores.communication),
    },
    reasons:         parsed.reasons,
    improvementTips: parsed.improvementTips,
    improvedAnswer:  parsed.improvedAnswer,
    star:            parsed.star,
  };
}

export async function detectGroqStar(answerText: string, question: string): Promise<StarResult> {
  const data = await groqJson<unknown>(`You are an interview coach checking STAR structure.

Question: ${question}
Answer: ${answerText}

Return JSON:
{
  "situation": { "present": true, "evidence": "..." },
  "task":      { "present": true, "evidence": "..." },
  "action":    { "present": true, "evidence": "..." },
  "result":    { "present": true, "evidence": "..." },
  "missingParts": [],
  "coachTip": "..."
}
`);

  return starSchema.parse(data);
}
