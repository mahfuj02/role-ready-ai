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
