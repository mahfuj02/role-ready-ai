export type DashboardStats = {
  totalSessions: number;
  totalQuestionsAttempted: number;
  averageScore: number;
  currentStreak: number; // days
};

export type RecentSession = {
  id: string;
  createdAt: Date;
  averageScore: number;
  questionCount: number;
  completedCount: number;
};

export type ScoreTrend = {
  date: string; // YYYY-MM-DD
  averageScore: number;
  sessionCount: number;
};

export type PerformanceByType = {
  type: "BEHAVIORAL" | "TECHNICAL";
  count: number;
  averageScore: number;
  averageRelevance: number;
  averageClarity: number;
  averageDepth: number;
  averageCommunication: number;
};

export type ScoreBreakdown = {
  relevance: number;
  clarity: number;
  depth: number;
  communication: number;
};

export type StarCompletion = {
  total: number;
  complete: number;
  percentage: number;
  situationCompletion: number;
  taskCompletion: number;
  actionCompletion: number;
  resultCompletion: number;
};

export type TopCoachingTip = {
  tip: string;
  count: number;
  fromProvider: "GEMINI" | "MOCK";
};

export type DashboardData = {
  stats: DashboardStats;
  recentSessions: RecentSession[];
  scoreTrends: ScoreTrend[];
  performanceByType: PerformanceByType[];
  scoreBreakdown: ScoreBreakdown;
  starCompletion: StarCompletion;
  topCoachingTips: TopCoachingTip[];
  weakestCategory: {
    category: "relevance" | "clarity" | "depth" | "communication";
    score: number;
  };
};
