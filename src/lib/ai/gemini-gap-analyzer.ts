import { z } from "zod";
import type { GapAnalysisInput, GapAnalysisResult } from "@/lib/ai/types";
import { extractJsonPayload, getGeminiClient, getGeminiModel } from "@/lib/ai/gemini-client";

const schema = z.object({
  matchScore: z.number().int().min(0).max(100),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().min(1),
        importance: z.enum(["critical", "nice-to-have"]),
        context: z.string().min(1),
      }),
    )
    .catch([]),
  resumeSuggestions: z
    .array(
      z.object({
        type: z.enum(["rewrite", "add"]),
        section: z.enum(["experience", "skills", "projects", "summary"]),
        original: z.string().nullable().catch(null),
        suggestion: z.string().min(1),
        reason: z.string().min(1),
      }),
    )
    .catch([]),
  keywordsMissing: z.array(z.string()).catch([]),
  strengthAreas: z.array(z.string()).catch([]),
});

export async function analyzeGeminiGap(input: GapAnalysisInput): Promise<GapAnalysisResult> {
  const client = getGeminiClient();

  if (!client) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const prompt = `You are a professional resume and job description analyzer.
Compare the resume against the job description and return a gap analysis.

Rules:
- Return valid JSON only. No markdown. No code fences.
- matchScore is an integer 0–100 reflecting how well the resume matches the JD.
- skillGaps should list skills required by the JD that are missing or weak in the resume.
- resumeSuggestions should give actionable rewrites or additions to close gaps.
  - For "rewrite" type, set original to the existing resume text being rewritten.
  - For "add" type, set original to null.
- keywordsMissing: important keywords/phrases from the JD not present in the resume.
- strengthAreas: areas where the resume already strongly matches the JD.
- Limit skillGaps to the 8 most impactful. Limit resumeSuggestions to 6. Limit keywordsMissing to 10.

Return this schema exactly:
{
  "matchScore": 74,
  "skillGaps": [
    {"skill": "...", "importance": "critical" | "nice-to-have", "context": "..."}
  ],
  "resumeSuggestions": [
    {"type": "rewrite" | "add", "section": "experience" | "skills" | "projects" | "summary", "original": "..." | null, "suggestion": "...", "reason": "..."}
  ],
  "keywordsMissing": ["keyword1", "keyword2"],
  "strengthAreas": ["strength1", "strength2"]
}

Role: ${input.roleTitle}
Seniority: ${input.seniority}

Resume:
${input.resumeText}

Job Description:
${input.jobDescriptionText}
`;

  const response = await client.models.generateContent({
    model: getGeminiModel(),
    contents: prompt,
  });

  const raw = response.text ?? "";
  const parsedJson = JSON.parse(extractJsonPayload(raw));
  const parsed = schema.parse(parsedJson);

  return {
    matchScore: parsed.matchScore,
    skillGaps: parsed.skillGaps,
    resumeSuggestions: parsed.resumeSuggestions,
    keywordsMissing: parsed.keywordsMissing,
    strengthAreas: parsed.strengthAreas,
  };
}
