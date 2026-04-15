import { z } from "zod";
import type { EvaluateAnswerInput, EvaluationResult, StarResult } from "@/lib/ai/types";
import { groqJson } from "@/lib/ai/groq-client";

const starSchema = z.object({
  situation: z.object({ present: z.boolean(), evidence: z.string() }),
  task:      z.object({ present: z.boolean(), evidence: z.string() }),
  action:    z.object({ present: z.boolean(), evidence: z.string() }),
  result:    z.object({ present: z.boolean(), evidence: z.string() }),
  missingParts: z.array(z.enum(["situation", "task", "action", "result"])).catch([]),
  coachTip: z.string().min(1).catch("Focus on answering the question directly before applying STAR structure."),
});

const evalSchema = z.object({
  scores: z.object({
    relevance:     z.number().min(0).max(5),
    clarity:       z.number().min(0).max(5),
    depth:         z.number().min(0).max(5),
    communication: z.number().min(0).max(5),
  }),
  reasons: z.object({
    relevance:     z.string().min(1).catch("Did not address the question"),
    clarity:       z.string().min(1).catch("Clear communication"),
    depth:         z.string().min(1).catch("Good depth of analysis"),
    communication: z.string().min(1).catch("Good communication skills"),
  }),
  improvementTips: z.array(z.string().min(1)).min(1).max(3)
    .catch(["Make sure your answer directly addresses what was asked"]),
  improvedAnswer: z.string().min(10)
    .catch("Rewrite your answer to directly address the question asked."),
  star: starSchema.optional(),
});

/**
 * Relevance gate: if the answer is off-topic, cap depth and clarity
 * so a well-structured irrelevant answer cannot score well overall.
 *
 * relevance 0–1 → depth and clarity capped at 1
 * relevance 2   → depth and clarity capped at 3
 */
function applyRelevanceGate(scores: {
  relevance: number;
  clarity: number;
  depth: number;
  communication: number;
}) {
  if (scores.relevance <= 1) {
    return {
      ...scores,
      clarity:       Math.min(scores.clarity, 1),
      depth:         Math.min(scores.depth, 1),
      communication: Math.min(scores.communication, 2),
    };
  }
  if (scores.relevance === 2) {
    return {
      ...scores,
      clarity: Math.min(scores.clarity, 3),
      depth:   Math.min(scores.depth, 3),
    };
  }
  return scores;
}

export async function evaluateGroqAnswer(input: EvaluateAnswerInput): Promise<EvaluationResult> {
  const isBehavioral = input.questionType === "BEHAVIORAL";

  const data = await groqJson<unknown>(`You are a strict interview evaluator. Your job is to score answers honestly.

## Scoring rules (integers 0–5)

**relevance** — Does the answer actually address the specific question asked?
- 0: Completely off-topic or refuses to answer
- 1: Barely touches the question
- 2: Partially relevant but misses the core
- 3: Addresses the question but with gaps
- 4: Directly answers the question
- 5: Directly and completely answers every part of the question

CRITICAL: STAR structure, fluency, and confidence DO NOT raise the relevance score.
An answer can be perfectly structured STAR format but score 0 on relevance if it doesn't address the question.

**depth** — Specificity, concrete examples, and detail.
- An irrelevant answer scores 0–1 on depth regardless of how detailed it is.

**clarity** — Structure, conciseness, ease of understanding.

**communication** — Professional tone, vocabulary, delivery.

${isBehavioral ? `## STAR analysis
Check if the answer uses Situation / Task / Action / Result structure — but only in the context of answering THIS specific question.
If the answer is off-topic, mark all STAR parts as present: false and set coachTip to redirect the candidate to answer the actual question first.` : "Technical question — omit the star field."}

Return JSON:
{
  "scores": { "relevance": 0, "clarity": 0, "depth": 0, "communication": 0 },
  "reasons": { "relevance": "...", "clarity": "...", "depth": "...", "communication": "..." },
  "improvementTips": ["tip1", "tip2"],
  "improvedAnswer": "A strong model answer to this specific question..."${isBehavioral ? `,
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
Resume: ${input.resumeText.slice(0, 600)}
Job description: ${input.jobDescriptionText.slice(0, 600)}
`);

  const parsed = evalSchema.parse(data);

  const rawScores = {
    relevance:     Math.round(parsed.scores.relevance),
    clarity:       Math.round(parsed.scores.clarity),
    depth:         Math.round(parsed.scores.depth),
    communication: Math.round(parsed.scores.communication),
  };

  // Apply relevance gate in code as a safety net
  const scores = applyRelevanceGate(rawScores);

  return {
    scores,
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
