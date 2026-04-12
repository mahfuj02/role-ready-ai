import { prisma } from "@/lib/prisma";
import type {
  DashboardStats,
  RecentSession,
  ScoreTrend,
  PerformanceByType,
  ScoreBreakdown,
  StarCompletion,
  TopCoachingTip,
  DashboardData,
} from "@/lib/dashboard/types";

/**
 * Calculate overall statistics for a specific job
 */
export async function getDashboardStats(userId: string, jobId: string): Promise<DashboardStats> {
  const sessions = await prisma.practiceSession.findMany({
    where: { userId, jobId },
    include: {
      answers: {
        include: { feedback: true },
      },
    },
  });

  const totalSessions = sessions.length;
  let totalScore = 0;
  let totalFeedbacks = 0;
  let totalQuestionsAttempted = 0;

  sessions.forEach((session) => {
    totalQuestionsAttempted += session.answers.length;
    session.answers.forEach((answer) => {
      if (answer.feedback) {
        totalFeedbacks++;
        const avgScore =
          (answer.feedback.relevance +
            answer.feedback.clarity +
            answer.feedback.depth +
            answer.feedback.communication) /
          4;
        totalScore += avgScore;
      }
    });
  });

  const averageScore = totalFeedbacks > 0 ? totalScore / totalFeedbacks : 0;
  let currentStreak = 0;

  const streakDays = new Set<string>();
  sessions.forEach((session) => {
    const dateStr = session.createdAt.toISOString().split("T")[0];
    streakDays.add(dateStr);
  });

  if (streakDays.size > 0) {
    const sortedDates = Array.from(streakDays).sort().reverse();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      for (let i = 0; i < sortedDates.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        const expectedDateStr = expectedDate.toISOString().split("T")[0];

        if (sortedDates[i] === expectedDateStr) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  return {
    totalSessions,
    totalQuestionsAttempted,
    averageScore: Math.round(averageScore * 100) / 100,
    currentStreak,
  };
}

/**
 * Get recent practice sessions for a specific job
 */
export async function getRecentSessions(userId: string, jobId: string): Promise<RecentSession[]> {
  const sessions = await prisma.practiceSession.findMany({
    where: { userId, jobId },
    include: {
      answers: {
        include: { feedback: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return sessions.map((session) => {
    const feedbackArray = session.answers
      .map((a) => a.feedback)
      .filter((fb) => fb !== null && fb !== undefined);

    const feedbackList = feedbackArray as NonNullable<typeof feedbackArray[0]>[];

    let totalScore = 0;
    if (feedbackList.length > 0) {
      feedbackList.forEach((fb) => {
        if (fb) {
          totalScore += (fb.relevance + fb.clarity + fb.depth + fb.communication) / 4;
        }
      });
    }

    return {
      id: session.id,
      createdAt: session.createdAt,
      averageScore:
        feedbackList.length > 0 ? Math.round((totalScore / feedbackList.length) * 100) / 100 : 0,
      questionCount: session.answers.length,
      completedCount: feedbackList.length,
    };
  });
}

/**
 * Get score trends for a specific job
 */
export async function getScoreTrends(userId: string, jobId: string): Promise<ScoreTrend[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const sessions = await prisma.practiceSession.findMany({
    where: {
      userId,
      jobId,
      createdAt: { gte: thirtyDaysAgo },
    },
    include: {
      answers: {
        include: { feedback: true },
      },
    },
  });

  const trendMap = new Map<string, { scores: number[]; sessions: Set<string> }>();

  sessions.forEach((session) => {
    const dateStr = session.createdAt.toISOString().split("T")[0];

    session.answers.forEach((answer) => {
      if (answer.feedback) {
        const avgScore =
          (answer.feedback.relevance +
            answer.feedback.clarity +
            answer.feedback.depth +
            answer.feedback.communication) /
          4;

        if (!trendMap.has(dateStr)) {
          trendMap.set(dateStr, { scores: [], sessions: new Set() });
        }
        trendMap.get(dateStr)!.scores.push(avgScore);
        trendMap.get(dateStr)!.sessions.add(session.id);
      }
    });
  });

  return Array.from(trendMap.entries())
    .map(([date, data]) => ({
      date,
      averageScore:
        data.scores.length > 0
          ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 100) / 100
          : 0,
      sessionCount: data.sessions.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get performance breakdown by question type for a specific job
 */
export async function getPerformanceByType(userId: string, jobId: string): Promise<PerformanceByType[]> {
  const questions = await prisma.question.findMany({
    where: {
      practiceSession: { userId, jobId },
    },
    include: {
      answers: {
        include: { feedback: true },
      },
    },
  });

  const typeMap = new Map<"BEHAVIORAL" | "TECHNICAL", { scores: number[][]; count: number }>();

  questions.forEach((question) => {
    const qType = question.type;
    question.answers.forEach((answer) => {
      if (answer.feedback) {
        if (!typeMap.has(qType)) {
          typeMap.set(qType, { scores: [], count: 0 });
        }
        typeMap.get(qType)!.scores.push([
          answer.feedback.relevance,
          answer.feedback.clarity,
          answer.feedback.depth,
          answer.feedback.communication,
        ]);
        typeMap.get(qType)!.count++;
      }
    });
  });

  return Array.from(typeMap.entries()).map(([type, data]) => {
    const avgScores = [0, 0, 0, 0];
    if (data.scores.length > 0) {
      for (let i = 0; i < 4; i++) {
        const sum = data.scores.reduce((acc, score) => acc + score[i], 0);
        avgScores[i] = Math.round((sum / data.scores.length) * 100) / 100;
      }
    }

    return {
      type,
      count: data.count,
      averageScore: Math.round((avgScores.reduce((a, b) => a + b) / 4) * 100) / 100,
      averageRelevance: avgScores[0],
      averageClarity: avgScores[1],
      averageDepth: avgScores[2],
      averageCommunication: avgScores[3],
    };
  });
}

/**
 * Get overall score breakdown for a specific job
 */
export async function getScoreBreakdown(userId: string, jobId: string): Promise<ScoreBreakdown> {
  const feedbacks = await prisma.feedback.findMany({
    where: {
      answer: {
        practiceSession: { userId, jobId },
      },
    },
  });

  if (feedbacks.length === 0) {
    return { relevance: 0, clarity: 0, depth: 0, communication: 0 };
  }

  const totalRelevance = feedbacks.reduce((sum, f) => sum + f.relevance, 0);
  const totalClarity = feedbacks.reduce((sum, f) => sum + f.clarity, 0);
  const totalDepth = feedbacks.reduce((sum, f) => sum + f.depth, 0);
  const totalCommunication = feedbacks.reduce((sum, f) => sum + f.communication, 0);

  return {
    relevance: Math.round((totalRelevance / feedbacks.length) * 100) / 100,
    clarity: Math.round((totalClarity / feedbacks.length) * 100) / 100,
    depth: Math.round((totalDepth / feedbacks.length) * 100) / 100,
    communication: Math.round((totalCommunication / feedbacks.length) * 100) / 100,
  };
}

/**
 * Get STAR completion metrics for a specific job
 */
export async function getStarCompletion(userId: string, jobId: string): Promise<StarCompletion> {
  const starAnalyses = await prisma.starAnalysis.findMany({
    where: {
      answer: {
        question: {
          practiceSession: { userId, jobId },
        },
      },
    },
  });

  if (starAnalyses.length === 0) {
    return {
      total: 0,
      complete: 0,
      percentage: 0,
      situationCompletion: 0,
      taskCompletion: 0,
      actionCompletion: 0,
      resultCompletion: 0,
    };
  }

  const complete = starAnalyses.filter(
    (s) => s.situation && s.task && s.action && s.result
  ).length;

  const situationComplete = starAnalyses.filter((s) => s.situation).length;
  const taskComplete = starAnalyses.filter((s) => s.task).length;
  const actionComplete = starAnalyses.filter((s) => s.action).length;
  const resultComplete = starAnalyses.filter((s) => s.result).length;

  return {
    total: starAnalyses.length,
    complete,
    percentage: Math.round((complete / starAnalyses.length) * 100),
    situationCompletion: Math.round((situationComplete / starAnalyses.length) * 100),
    taskCompletion: Math.round((taskComplete / starAnalyses.length) * 100),
    actionCompletion: Math.round((actionComplete / starAnalyses.length) * 100),
    resultCompletion: Math.round((resultComplete / starAnalyses.length) * 100),
  };
}

/**
 * Get top coaching tips for a specific job
 */
export async function getTopCoachingTips(
  userId: string,
  jobId: string,
  limit = 5
): Promise<TopCoachingTip[]> {
  const starAnalyses = await prisma.starAnalysis.findMany({
    where: {
      answer: {
        question: {
          practiceSession: { userId, jobId },
        },
      },
    },
    select: { coachTip: true, provider: true },
  });

  const tipsMap = new Map<string, { count: number; provider: "GEMINI" | "MOCK" }>();

  starAnalyses.forEach((star) => {
    if (star.coachTip) {
      if (!tipsMap.has(star.coachTip)) {
        tipsMap.set(star.coachTip, { count: 0, provider: star.provider });
      }
      tipsMap.get(star.coachTip)!.count++;
    }
  });

  return Array.from(tipsMap.entries())
    .map(([tip, data]) => ({
      tip,
      count: data.count,
      fromProvider: data.provider,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get weakest score category for a specific job
 */
export async function getWeakestCategory(
  userId: string,
  jobId: string
): Promise<{ category: "relevance" | "clarity" | "depth" | "communication"; score: number }> {
  const breakdown = await getScoreBreakdown(userId, jobId);

  const categories = [
    { category: "relevance" as const, score: breakdown.relevance },
    { category: "clarity" as const, score: breakdown.clarity },
    { category: "depth" as const, score: breakdown.depth },
    { category: "communication" as const, score: breakdown.communication },
  ];

  return categories.reduce((weakest, current) =>
    current.score < weakest.score ? current : weakest
  );
}

/**
 * Get complete dashboard data for a specific job
 */
export async function getDashboardData(userId: string, jobId: string): Promise<DashboardData> {
  const [
    stats,
    recentSessions,
    scoreTrends,
    performanceByType,
    scoreBreakdown,
    starCompletion,
    topCoachingTips,
    weakestCategory,
  ] = await Promise.all([
    getDashboardStats(userId, jobId),
    getRecentSessions(userId, jobId),
    getScoreTrends(userId, jobId),
    getPerformanceByType(userId, jobId),
    getScoreBreakdown(userId, jobId),
    getStarCompletion(userId, jobId),
    getTopCoachingTips(userId, jobId),
    getWeakestCategory(userId, jobId),
  ]);

  return {
    stats,
    recentSessions,
    scoreTrends,
    performanceByType,
    scoreBreakdown,
    starCompletion,
    topCoachingTips,
    weakestCategory,
  };
}
