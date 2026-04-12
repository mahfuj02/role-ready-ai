export type GeneratedQuestion = {
  question: string;
  type: "BEHAVIORAL" | "TECHNICAL";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  starRecommended: boolean;
};

export type GenerateQuestionsInput = {
  roleTitle: string;
  seniority: string;
  resumeText: string;
  jobDescriptionText: string;
  totalQuestions?: number;
};

export type EvaluateAnswerInput = {
  question: string;
  questionType: "BEHAVIORAL" | "TECHNICAL";
  answerText: string;
  roleTitle: string;
  resumeText: string;
  jobDescriptionText: string;
};

export type EvaluationScores = {
  relevance: number;
  clarity: number;
  depth: number;
  communication: number;
};

export type EvaluationReasons = {
  relevance: string;
  clarity: string;
  depth: string;
  communication: string;
};

export type EvaluationResult = {
  scores: EvaluationScores;
  reasons: EvaluationReasons;
  improvementTips: string[];
  improvedAnswer: string;
  star?: StarResult;
};

export type AiProviderSource = "GEMINI" | "MOCK";

export type EvaluationWithSource = {
  provider: AiProviderSource;
  result: EvaluationResult;
};

export type StarPart = {
  present: boolean;
  evidence: string;
};

export type StarResult = {
  situation: StarPart;
  task: StarPart;
  action: StarPart;
  result: StarPart;
  missingParts: Array<"situation" | "task" | "action" | "result">;
  coachTip: string;
};

export type StarWithSource = {
  provider: AiProviderSource;
  result: StarResult;
};

// ── Gap Analysis ─────────────────────────────────────────────────────────────

export type GapAnalysisInput = {
  roleTitle: string;
  seniority: string;
  resumeText: string;
  jobDescriptionText: string;
};

export type SkillGap = {
  skill: string;
  importance: "critical" | "nice-to-have";
  context: string;
};

export type ResumeSuggestion = {
  type: "rewrite" | "add";
  section: "experience" | "skills" | "projects" | "summary";
  original: string | null;
  suggestion: string;
  reason: string;
};

export type GapAnalysisResult = {
  matchScore: number;
  skillGaps: SkillGap[];
  resumeSuggestions: ResumeSuggestion[];
  keywordsMissing: string[];
  strengthAreas: string[];
};
