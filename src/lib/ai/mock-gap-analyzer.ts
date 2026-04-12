import type { GapAnalysisInput, GapAnalysisResult, SkillGap, ResumeSuggestion } from "@/lib/ai/types";

function extractWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );
}

const COMMON_TECH_KEYWORDS = [
  "react", "typescript", "node", "python", "sql", "api", "testing",
  "docker", "kubernetes", "agile", "scrum", "rest", "graphql", "aws",
  "postgres", "redis", "cicd", "github", "performance", "scalability",
];

export function analyzeMockGap(input: GapAnalysisInput): GapAnalysisResult {
  const resumeWords = extractWords(input.resumeText);
  const jdWords = extractWords(input.jobDescriptionText);

  const matchingWords = [...jdWords].filter((w) => resumeWords.has(w));
  const matchScore = Math.min(
    95,
    Math.max(20, Math.round((matchingWords.length / Math.max(jdWords.size, 1)) * 100)),
  );

  const keywordsMissing = COMMON_TECH_KEYWORDS.filter(
    (k) => jdWords.has(k) && !resumeWords.has(k),
  ).slice(0, 10);

  const skillGaps: SkillGap[] = keywordsMissing.slice(0, 5).map((skill, i) => ({
    skill,
    importance: i < 2 ? "critical" : "nice-to-have",
    context: `"${skill}" appears in the job description but is not clearly demonstrated in your resume.`,
  }));

  if (skillGaps.length === 0) {
    skillGaps.push({
      skill: "quantified achievements",
      importance: "critical",
      context: "The JD emphasizes impact — add specific numbers and outcomes to your resume bullets.",
    });
  }

  const resumeSuggestions: ResumeSuggestion[] = [
    {
      type: "add",
      section: "skills",
      original: null,
      suggestion: keywordsMissing.length > 0 ? keywordsMissing.join(", ") : "Add relevant technical skills from the JD",
      reason: "These keywords appear in the job description and are missing from your skills section.",
    },
    {
      type: "rewrite",
      section: "experience",
      original: "Worked on various features",
      suggestion: `Led development of key features for ${input.roleTitle} responsibilities, delivering measurable improvements in performance and reliability.`,
      reason: "Generic bullets reduce impact — tie each point to a specific outcome or metric.",
    },
    {
      type: "add",
      section: "summary",
      original: null,
      suggestion: `${input.seniority} ${input.roleTitle} with proven experience delivering high-quality solutions. Skilled in cross-functional collaboration and driving impact through technical excellence.`,
      reason: "A tailored summary at the top immediately signals fit for this specific role.",
    },
  ];

  const strengthAreas = matchingWords
    .filter((w) => w.length > 4)
    .slice(0, 5)
    .map((w) => `Strong alignment on "${w}"`);

  if (strengthAreas.length === 0) {
    strengthAreas.push("Resume demonstrates relevant experience for the seniority level");
  }

  return {
    matchScore,
    skillGaps,
    resumeSuggestions,
    keywordsMissing,
    strengthAreas,
  };
}
