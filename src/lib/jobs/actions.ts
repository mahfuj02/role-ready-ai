"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export type JobWithStats = {
  id: string;
  name: string;
  description?: string;
  setupProfile?: {
    roleTitle: string;
    seniority: string;
  };
  sessionCount: number;
  totalQuestionsAttempted: number;
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
        },
      },
      practiceSessions: {
        select: {
          id: true,
          createdAt: true,
          answers: {
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return jobs.map((job) => ({
    id: job.id,
    name: job.name,
    description: job.description || undefined,
    setupProfile: job.setupProfile
      ? {
          roleTitle: job.setupProfile.roleTitle,
          seniority: job.setupProfile.seniority,
        }
      : undefined,
    sessionCount: job.practiceSessions.length,
    totalQuestionsAttempted: job.practiceSessions.reduce(
      (sum, session) => sum + session.answers.length,
      0
    ),
    lastPracticedAt:
      job.practiceSessions.length > 0
        ? job.practiceSessions[0].createdAt
        : undefined,
    createdAt: job.createdAt,
  }));
}

/**
 * Create a new job
 */
export async function createJob(name: string, description?: string): Promise<string | null> {
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
    include: {
      jobs: {
        where: { id: { equals: "" } }, // Will be overridden
        take: 1,
      },
    },
  });

  if (!user || !user.currentJobId) {
    return null;
  }

  return await prisma.job.findUnique({
    where: { id: user.currentJobId },
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

  // Verify job belongs to user
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

  // If this was current job, set to null
  if (user.currentJobId === jobId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { currentJobId: null },
    });
  }

  return true;
}
