"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

const setupSchema = z.object({
  roleTitle: z.string().trim().min(2).max(120),
  seniority: z.string().trim().min(2).max(80),
  resumeText: z.string().trim().min(100),
  jobDescriptionText: z.string().trim().min(100),
});

export async function saveSetupProfile(formData: FormData) {
  const sessionUser = await requireUser();

  if (!sessionUser.email) {
    redirect("/sign-in");
  }

  const parsed = setupSchema.safeParse({
    roleTitle: formData.get("roleTitle"),
    seniority: formData.get("seniority"),
    resumeText: formData.get("resumeText"),
    jobDescriptionText: formData.get("jobDescriptionText"),
  });

  if (!parsed.success) {
    redirect("/setup?error=validation");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { id: true },
  });

  if (!dbUser) {
    redirect("/sign-in");
  }

  await prisma.setupProfile.create({
    data: {
      userId: dbUser.id,
      roleTitle: parsed.data.roleTitle,
      seniority: parsed.data.seniority,
      resumeText: parsed.data.resumeText,
      jobDescriptionText: parsed.data.jobDescriptionText,
    },
  });

  redirect("/setup?saved=1");
}
