"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export type SkillTag = {
  label: string;
  variant: "missing" | "weak" | "strong";
};

export type JobWithStats = {
  id: string;
  name: string;
  companyName: string;
  roleTitle: string;
  seniority: string;
  sessionCount: number;
  totalQuestionsAttempted: number;
  totalQuestionsAvailable: number;
  matchScore?: number;
  sessionScore?: number; // avg practice score (0–100) from latest session
  skillTags: SkillTag[];
  status: "new" | "just_started" | "active";
  lastOpenedAt: Date;
  lastPracticedAt?: Date;
  createdAt: Date;
};

/**
 * Get all jobs for the current user
 */
export async function getUserJobs(): Promise<JobWithStats[]> {
  const session = await auth();

  if (!session?.user?.email) {
    return [];
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return [];
  }

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    include: {
      setupProfile: {
        select: {
          roleTitle: true,
          seniority: true,
          gapAnalysis: {
            select: {
              matchScore: true,
              skillGaps: true,
              strengthAreas: true,
            },
          },
        },
      },
      practiceSessions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          totalQuestions: true,
          answers: {
            select: {
              id: true,
              feedback: {
                select: {
                  relevance: true,
                  clarity: true,
                  depth: true,
                  communication: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return jobs.map((job) => {
    // Parse company + role from "Company - Role" or fall back to setupProfile
    const nameParts = job.name.split(" - ");
    const companyName = nameParts.length > 1 ? nameParts[0].trim() : "";
    const fallbackRole =
      nameParts.length > 1 ? nameParts.slice(1).join(" - ").trim() : job.name;
    const roleTitle = job.setupProfile?.roleTitle || fallbackRole;
    const seniority = job.setupProfile?.seniority || "";

    // Progress — based on latest session only
    const latestSession = job.practiceSessions[0];
    const totalQuestionsAttempted = latestSession?.answers.length ?? 0;
    const totalQuestionsAvailable = latestSession?.totalQuestions ?? 0;

    // Status
    const pct =
      totalQuestionsAvailable > 0
        ? totalQuestionsAttempted / totalQuestionsAvailable
        : 0;
    const status =
      job.practiceSessions.length === 0
        ? "new"
        : pct >= 0.3
          ? "active"
          : "just_started";

    // Session score — avg feedback from latest session's answered questions
    const answersWithFeedback = latestSession?.answers.filter((a) => a.feedback) ?? [];
    const sessionScore =
      answersWithFeedback.length > 0
        ? Math.round(
            answersWithFeedback.reduce((sum, a) => {
              const f = a.feedback!;
              return sum + ((f.relevance + f.clarity + f.depth + f.communication) / 4) * 20;
            }, 0) / answersWithFeedback.length
          )
        : undefined;

    // Gap analysis data
    const ga = job.setupProfile?.gapAnalysis;
    const matchScore = ga?.matchScore ?? undefined;

    const skillTags: SkillTag[] = [];
    if (ga) {
      type RawGap = { skill: string; importance: string };
      const gaps = (ga.skillGaps as RawGap[]) ?? [];
      for (const g of gaps.slice(0, 2)) {
        skillTags.push({
          label: `${g.skill} ${g.importance === "critical" ? "missing" : "weak"}`,
          variant: g.importance === "critical" ? "missing" : "weak",
        });
      }
      const strengths = (ga.strengthAreas as string[]) ?? [];
      if (strengths.length > 0 && skillTags.length < 3) {
        skillTags.push({ label: `${strengths[0]} strong`, variant: "strong" });
      }
    }

    return {
      id: job.id,
      name: job.name,
      companyName,
      roleTitle,
      seniority,
      sessionCount: job.practiceSessions.length,
      totalQuestionsAttempted,
      totalQuestionsAvailable,
      matchScore,
      sessionScore,
      skillTags,
      status,
      lastOpenedAt: job.updatedAt,
      lastPracticedAt:
        job.practiceSessions.length > 0
          ? job.practiceSessions[0].createdAt
          : undefined,
      createdAt: job.createdAt,
    };
  });
}

export type DashboardStats = {
  questionsThisWeek: number;
  avgScorePct: number | null;
  weakestArea: { label: string; pct: number } | null;
  inProgress: {
    sessionId: string;
    jobName: string;
    company: string;
    role: string;
    answered: number;
    total: number;
  } | null;
  lastSession: { label: string; createdAt: Date } | null;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const session = await auth();
  if (!session?.user?.email) return { questionsThisWeek: 0, avgScorePct: null, weakestArea: null, inProgress: null, lastSession: null };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return { questionsThisWeek: 0, avgScorePct: null, weakestArea: null, inProgress: null, lastSession: null };

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // All feedbacks for user
  const feedbacks = await prisma.feedback.findMany({
    where: { answer: { practiceSession: { userId: user.id } } },
    select: {
      relevance: true, clarity: true, depth: true, communication: true,
      createdAt: true,
    },
  });

  const thisWeek = feedbacks.filter((f) => f.createdAt >= oneWeekAgo);

  // Avg score (0–100)
  const avgScorePct =
    feedbacks.length > 0
      ? Math.round(
          feedbacks.reduce((s, f) => s + ((f.relevance + f.clarity + f.depth + f.communication) / 4) * 20, 0) /
            feedbacks.length,
        )
      : null;

  // Weakest dimension
  let weakestArea: DashboardStats["weakestArea"] = null;
  if (feedbacks.length > 0) {
    const dims = { Relevance: 0, Clarity: 0, Depth: 0, Communication: 0 };
    feedbacks.forEach((f) => {
      dims.Relevance     += f.relevance;
      dims.Clarity       += f.clarity;
      dims.Depth         += f.depth;
      dims.Communication += f.communication;
    });
    const [label, total] = Object.entries(dims).sort((a, b) => a[1] - b[1])[0];
    weakestArea = { label, pct: Math.round((total / feedbacks.length) * 20) };
  }

  // Most recent in-progress session (has questions, not completed)
  const inProgressRaw = await prisma.practiceSession.findFirst({
    where: { userId: user.id, completedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      job: { select: { name: true } },
      questions: { select: { id: true } },
      answers:   { select: { id: true } },
      setupProfile: { select: { roleTitle: true } },
    },
  });

  let inProgress: DashboardStats["inProgress"] = null;
  if (inProgressRaw && inProgressRaw.questions.length > 0) {
    const jobName = inProgressRaw.job?.name ?? inProgressRaw.setupProfile.roleTitle;
    const parts   = jobName.split(" - ");
    inProgress = {
      sessionId: inProgressRaw.id,
      jobName,
      company:  parts.length > 1 ? parts[0] : "",
      role:     parts.length > 1 ? parts.slice(1).join(" - ") : jobName,
      answered: inProgressRaw.answers.length,
      total:    inProgressRaw.questions.length,
    };
  }

  // Last session label
  const lastSessionRaw = await prisma.practiceSession.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      job: { select: { name: true } },
      setupProfile: { select: { roleTitle: true } },
    },
  });

  let lastSession: DashboardStats["lastSession"] = null;
  if (lastSessionRaw) {
    const jobName = lastSessionRaw.job?.name ?? lastSessionRaw.setupProfile.roleTitle;
    const parts   = jobName.split(" - ");
    const label   = parts.length > 1 ? `${parts[0]} · ${parts.slice(1).join(" - ")}` : jobName;
    lastSession = { label, createdAt: lastSessionRaw.createdAt };
  }

  return { questionsThisWeek: thisWeek.length, avgScorePct, weakestArea, inProgress, lastSession };
}

/**
 * Create a new job
 */
export async function createJob(
  name: string,
  description?: string
): Promise<string | null> {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return null;
  }

  const job = await prisma.job.create({
    data: {
      userId: user.id,
      name,
      description,
    },
  });

  // Set as current job
  await prisma.user.update({
    where: { id: user.id },
    data: { currentJobId: job.id },
  });

  return job.id;
}

/**
 * Get current job for user
 */
export async function getCurrentJob() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, currentJobId: true },
  });

  if (!user || !user.currentJobId) {
    return null;
  }

  return await prisma.job.findFirst({
    where: { id: user.currentJobId, userId: user.id },
    include: {
      setupProfile: true,
    },
  });
}

/**
 * Set current job
 */
export async function setCurrentJob(jobId: string): Promise<boolean> {
  const session = await auth();

  if (!session?.user?.email) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return false;
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
  });

  if (!job) {
    return false;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { currentJobId: jobId },
  });

  await prisma.job.update({
    where: { id: jobId },
    data: { updatedAt: new Date() },
  });

  return true;
}

/**
 * Update job name and description
 */
export async function updateJob(
  jobId: string,
  name: string,
  description?: string
): Promise<boolean> {
  const session = await auth();

  if (!session?.user?.email) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return false;
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
  });

  if (!job) {
    return false;
  }

  await prisma.job.update({
    where: { id: jobId },
    data: { name, description },
  });

  return true;
}

/**
 * Delete job and all related data
 */
export async function deleteJob(jobId: string): Promise<boolean> {
  const session = await auth();

  if (!session?.user?.email) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, currentJobId: true },
  });

  if (!user) {
    return false;
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
  });

  if (!job) {
    return false;
  }

  await prisma.job.delete({
    where: { id: jobId },
  });

  if (user.currentJobId === jobId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { currentJobId: null },
    });
  }

  return true;
}
