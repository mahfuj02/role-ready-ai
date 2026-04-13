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
            select: { id: true },
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

    // Progress
    const totalQuestionsAttempted = job.practiceSessions.reduce(
      (sum, s) => sum + s.answers.length,
      0
    );
    const totalQuestionsAvailable = job.practiceSessions.reduce(
      (sum, s) => sum + s.totalQuestions,
      0
    );

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
