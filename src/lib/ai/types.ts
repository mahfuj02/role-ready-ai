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
