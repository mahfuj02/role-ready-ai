import { prisma } from "@/lib/prisma";
import { generateMockQuestions } from "@/lib/ai/mock-question-generator";

export type CreatePracticeSessionResult = {
  practiceSessionId: string;
  totalQuestions: number;
};

export async function createPracticeSessionFromLatestSetup(
  email: string,
): Promise<CreatePracticeSessionResult | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return null;
  }

  const latestSetup = await prisma.setupProfile.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!latestSetup) {
    return null;
  }

  const generated = generateMockQuestions({
    roleTitle: latestSetup.roleTitle,
    seniority: latestSetup.seniority,
    resumeText: latestSetup.resumeText,
    jobDescriptionText: latestSetup.jobDescriptionText,
    totalQuestions: 10,
  });

  const session = await prisma.practiceSession.create({
    data: {
      userId: user.id,
      setupProfileId: latestSetup.id,
      totalQuestions: generated.length,
      questions: {
        create: generated.map((item, index) => ({
          position: index + 1,
          text: item.question,
          type: item.type,
          difficulty: item.difficulty,
          starRecommended: item.starRecommended,
        })),
      },
    },
    select: {
      id: true,
      totalQuestions: true,
    },
  });

  return {
    practiceSessionId: session.id,
    totalQuestions: session.totalQuestions,
  };
}
