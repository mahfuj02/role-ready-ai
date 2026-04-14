import { z } from "zod";
import type { GapAnalysisInput, GapAnalysisResult } from "@/lib/ai/types";
import { groqJson } from "@/lib/ai/groq-client";

const schema = z.object({
  matchScore: z.number().int().min(0).max(100),
  skillGaps: z
    .array(z.object({
      skill:      z.string().min(1),
      importance: z.enum(["critical", "nice-to-have"]),
      context:    z.string().min(1),
    }))
    .catch([]),
  resumeSuggestions: z
    .array(z.object({
      type:       z.enum(["rewrite", "add"]),
      section:    z.enum(["experience", "skills", "projects", "summary"]),
      original:   z.string().nullable().catch(null),
      suggestion: z.string().min(1),
      reason:     z.string().min(1),
    }))
    .catch([]),
  keywordsMissing: z.array(z.string()).catch([]),
  strengthAreas:   z.array(z.string()).catch([]),
});

export async function analyzeGroqGap(input: GapAnalysisInput): Promise<GapAnalysisResult> {
  const data = await groqJson<unknown>(`You are a professional resume and job description analyzer.
Compare the resume against the job description and return a gap analysis as JSON.

Rules:
- matchScore: integer 0–100 reflecting how well the resume matches the JD.
- skillGaps: skills required by the JD that are missing or weak in the resume. Limit to 8.
- resumeSuggestions: actionable rewrites or additions to close gaps. Limit to 6.
  - "rewrite": set original to the existing text being replaced.
  - "add": set original to null.
- keywordsMissing: important JD keywords not in the resume. Limit to 10.
- strengthAreas: areas where the resume already strongly matches. Limit to 5.

Role: ${input.roleTitle}
Seniority: ${input.seniority}

Resume:
${input.resumeText}

Job Description:
${input.jobDescriptionText}
`);

  const parsed = schema.parse(data);
  return parsed;
}
