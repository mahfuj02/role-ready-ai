import { z } from "zod";
import type { GapAnalysisInput, GapAnalysisResult } from "@/lib/ai/types";
import { groqJson } from "@/lib/ai/groq-client";

/** If Groq omits the `skill` field, pull the skill name from the context string. */
function normalizeSkillGaps(arr: unknown): unknown {
  if (!Array.isArray(arr)) return [];
  return arr.map((item: unknown) => {
    const obj = item as Record<string, unknown>;
    if (!obj.skill && obj.context) {
      // "The job requires Vue.js, but..." → "Vue.js"
      const m = String(obj.context).match(
        /requires?\s+(?:strong\s+)?(?:proficiency\s+in\s+|experience\s+with\s+)?([A-Za-z0-9./#+ ]+?)(?:\s*,|\s+but|\s+and\s+the|\.|$)/i,
      );
      obj.skill = m?.[1]?.trim() ?? "Missing skill";
    }
    return obj;
  });
}

const schema = z.object({
  matchScore: z.number().int().min(0).max(100),
  skillGaps: z.preprocess(
    normalizeSkillGaps,
    z.array(z.object({
      skill: z.string().min(1),
      importance: z.string().transform((v) =>
        ["critical", "required", "must-have"].includes(v) ? "critical" : "nice-to-have"
      ) as z.ZodType<"critical" | "nice-to-have">,
      context: z.string().min(1),
    })).catch([]),
  ),
  resumeSuggestions: z.preprocess(
    (arr) => Array.isArray(arr) ? arr : [],
    z.array(z.object({
      type:       z.string().transform((v) => v === "add" ? "add" : "rewrite") as z.ZodType<"rewrite" | "add">,
      section:    z.string().transform((v) =>
        (["experience","skills","projects","summary"] as string[]).includes(v)
          ? v as "experience"|"skills"|"projects"|"summary"
          : "experience" as const
      ),
      original:   z.string().nullable().catch(null),
      suggestion: z.string().min(1),
      reason:     z.string().min(1),
    })).catch([]),
  ),
  keywordsMissing: z.array(z.string()).catch([]),
  strengthAreas:   z.array(z.string()).catch([]),
});

export async function analyzeGroqGap(input: GapAnalysisInput): Promise<GapAnalysisResult> {
  const raw = await groqJson<unknown>(`You are a professional resume and job description analyzer.
Compare the resume against the job description and return a gap analysis as JSON.

IMPORTANT: Every item in skillGaps MUST include a "skill" field with the skill/technology name (e.g. "Vue.js", "GraphQL").
A matchScore below 80 means there are gaps — never return an empty skillGaps array for a low score.

Return this exact JSON structure:
{
  "matchScore": 0-100,
  "skillGaps": [
    { "skill": "Vue.js", "importance": "critical", "context": "..." },
    { "skill": "GraphQL", "importance": "nice-to-have", "context": "..." }
  ],
  "resumeSuggestions": [
    { "type": "rewrite", "section": "experience", "original": "...", "suggestion": "...", "reason": "..." },
    { "type": "add", "section": "skills", "original": null, "suggestion": "...", "reason": "..." }
  ],
  "keywordsMissing": ["keyword1", "keyword2"],
  "strengthAreas": ["strength1", "strength2"]
}

Rules:
- skillGaps: skills/technologies in the JD missing or weak in the resume. Max 8.
  - importance: "critical" if required by the JD, "nice-to-have" if preferred/bonus.
  - context: one sentence explaining the gap.
- resumeSuggestions: concrete bullet rewrites or additions. Max 6.
- keywordsMissing: important JD keywords not in the resume. Max 10.
- strengthAreas: areas the resume already covers well. Max 5.

Role: ${input.roleTitle}
Seniority: ${input.seniority}

Resume:
${input.resumeText}

Job Description:
${input.jobDescriptionText}
`);

  const parsed = schema.parse(raw);
  return parsed;
}
