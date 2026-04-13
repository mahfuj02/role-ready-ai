"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { generateAndSaveGapAnalysis } from "@/lib/gap-analysis/generate-gap-analysis";
import { createPracticeSessionFromLatestSetup } from "@/lib/practice/create-practice-session";

const newPrepSchema = z.object({
  roleTitle: z.string().trim().min(2).max(120),
  company: z.string().trim().max(120).optional(),
  seniority: z.string().trim().min(2).max(80),
  resumeText: z.string().trim().min(100),
  jobDescriptionText: z.string().trim().min(100),
});

export async function createNewPrep(formData: FormData) {
  const sessionUser = await requireUser();

  if (!sessionUser.email) {
    redirect("/sign-in");
  }

  const rawCompany = (formData.get("company") as string)?.trim();

  const parsed = newPrepSchema.safeParse({
    roleTitle: formData.get("roleTitle"),
    company: rawCompany || undefined,
    seniority: formData.get("seniority"),
    resumeText: formData.get("resumeText"),
    jobDescriptionText: formData.get("jobDescriptionText"),
  });

  if (!parsed.success) {
    redirect("/jobs/new?error=validation");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { id: true },
  });

  if (!dbUser) {
    redirect("/sign-in");
  }

  const { roleTitle, company, seniority, resumeText, jobDescriptionText } = parsed.data;

  // Job name: "Company - Role" if company provided, else just role title
  const jobName = company ? `${company} - ${roleTitle}` : roleTitle;

  const job = await prisma.job.create({
    data: { userId: dbUser.id, name: jobName },
  });

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { currentJobId: job.id },
  });

  const profile = await prisma.setupProfile.create({
    data: {
      userId: dbUser.id,
      jobId: job.id,
      roleTitle,
      seniority,
      resumeText,
      jobDescriptionText,
    },
    select: { id: true },
  });

  // Kick off gap analysis + question generation async — don't block redirect
  generateAndSaveGapAnalysis(profile.id).catch(() => {});
  createPracticeSessionFromLatestSetup(sessionUser.email).catch(() => {});

  redirect(`/gap-analysis?job=${job.id}`);
}
