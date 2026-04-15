"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateAndSaveGapAnalysis } from "@/lib/gap-analysis/generate-gap-analysis";
import { createPracticeSessionFromLatestSetup } from "@/lib/practice/create-practice-session";

export async function reanalyseJob(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) redirect("/sign-in");

  const jobId          = String(formData.get("jobId") ?? "").trim();
  const setupProfileId = String(formData.get("setupProfileId") ?? "").trim();
  const resumeText     = String(formData.get("resumeText") ?? "").trim();

  if (!jobId || !setupProfileId || resumeText.length < 100) {
    redirect(`/gap-analysis?job=${jobId}&error=validation`);
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true },
  });
  if (!dbUser) redirect("/sign-in");

  // Verify ownership
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: dbUser.id },
    select: { id: true },
  });
  if (!job) redirect("/");

  // Update the resume text
  await prisma.setupProfile.update({
    where: { id: setupProfileId },
    data: { resumeText },
  });

  // Delete old gap analysis so the waiting state shows
  await prisma.gapAnalysis.deleteMany({
    where: { setupProfileId },
  });

  // Run after response is sent so the tasks aren't killed by the redirect
  after(async () => {
    await generateAndSaveGapAnalysis(setupProfileId).catch(() => {});
    await createPracticeSessionFromLatestSetup(dbUser.email!).catch(() => {});
  });

  redirect(`/gap-analysis?job=${jobId}`);
}
