import { prisma } from "@/lib/prisma";
import { analyzeGap } from "@/lib/ai/gap-analyzer";
import type { GapAnalysisResult } from "@/lib/ai/types";

export type GenerateGapAnalysisResult = GapAnalysisResult & {
  gapAnalysisId: string;
};

export async function generateAndSaveGapAnalysis(
  setupProfileId: string,
): Promise<GenerateGapAnalysisResult | null> {
  const setup = await prisma.setupProfile.findUnique({
    where: { id: setupProfileId },
    select: {
      roleTitle: true,
      seniority: true,
      resumeText: true,
      jobDescriptionText: true,
    },
  });

  if (!setup) {
    return null;
  }

  const result = await analyzeGap({
    roleTitle: setup.roleTitle,
    seniority: setup.seniority,
    resumeText: setup.resumeText,
    jobDescriptionText: setup.jobDescriptionText,
  });

  const provider = process.env.GEMINI_API_KEY ? "GEMINI" : "MOCK";

  const saved = await prisma.gapAnalysis.upsert({
    where: { setupProfileId },
    update: {
      provider,
      matchScore: result.matchScore,
      skillGaps: result.skillGaps,
      resumeSuggestions: result.resumeSuggestions,
      keywordsMissing: result.keywordsMissing,
      strengthAreas: result.strengthAreas,
    },
    create: {
      setupProfileId,
      provider,
      matchScore: result.matchScore,
      skillGaps: result.skillGaps,
      resumeSuggestions: result.resumeSuggestions,
      keywordsMissing: result.keywordsMissing,
      strengthAreas: result.strengthAreas,
    },
  });

  return {
    gapAnalysisId: saved.id,
    ...result,
  };
}
