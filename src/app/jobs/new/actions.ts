"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { generateAndSaveGapAnalysis } from "@/lib/gap-analysis/generate-gap-analysis";

const newPrepSchema = z.object({
  roleTitle: z.string().trim().min(2).max(120),
  seniority: z.string().trim().min(2).max(80),
  resumeText: z.string().trim().min(100),
  jobDescriptionText: z.string().trim().min(100),
});

export async function createNewPrep(formData: FormData) {
  const sessionUser = await requireUser();

  if (!sessionUser.email) {
    redirect("/sign-in");
  }

  const parsed = newPrepSchema.safeParse({
    roleTitle: formData.get("roleTitle"),
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

  const { roleTitle, seniority, resumeText, jobDescriptionText } = parsed.data;

  // Create the job (name = role title)
  const job = await prisma.job.create({
    data: { userId: dbUser.id, name: roleTitle },
  });

  // Set as current job
  await prisma.user.update({
    where: { id: dbUser.id },
    data: { currentJobId: job.id },
  });

  // Create the setup profile linked to the job
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

  // Kick off gap analysis async — don't block the redirect
  generateAndSaveGapAnalysis(profile.id).catch(() => {});

  redirect(`/gap-analysis?job=${job.id}`);
}
