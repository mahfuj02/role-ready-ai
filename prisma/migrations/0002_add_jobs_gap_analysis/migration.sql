-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('GEMINI', 'MOCK');

-- CreateEnum
CREATE TYPE "AnswerInputType" AS ENUM ('TEXT', 'SPEECH');

-- AlterTable: add currentJobId to User
ALTER TABLE "User" ADD COLUMN "currentJobId" TEXT;

-- AlterTable: add jobId to SetupProfile
ALTER TABLE "SetupProfile" ADD COLUMN "jobId" TEXT;

-- AlterTable: add jobId to PracticeSession
ALTER TABLE "PracticeSession" ADD COLUMN "jobId" TEXT;

-- AlterTable: add inputType to Answer
ALTER TABLE "Answer" ADD COLUMN "inputType" "AnswerInputType" NOT NULL DEFAULT 'TEXT';

-- AlterTable: add provider to Feedback
ALTER TABLE "Feedback" ADD COLUMN "provider" "AiProvider" NOT NULL DEFAULT 'MOCK';

-- AlterTable: add provider to StarAnalysis
ALTER TABLE "StarAnalysis" ADD COLUMN "provider" "AiProvider" NOT NULL DEFAULT 'MOCK';

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GapAnalysis" (
    "id" TEXT NOT NULL,
    "setupProfileId" TEXT NOT NULL,
    "provider" "AiProvider" NOT NULL DEFAULT 'GEMINI',
    "matchScore" INTEGER NOT NULL,
    "skillGaps" JSONB NOT NULL,
    "resumeSuggestions" JSONB NOT NULL,
    "keywordsMissing" TEXT[],
    "strengthAreas" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GapAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_userId_createdAt_idx" ON "Job"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GapAnalysis_setupProfileId_key" ON "GapAnalysis"("setupProfileId");

-- CreateIndex
CREATE INDEX "GapAnalysis_setupProfileId_idx" ON "GapAnalysis"("setupProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "SetupProfile_jobId_key" ON "SetupProfile"("jobId");

-- CreateIndex
CREATE INDEX "PracticeSession_jobId_idx" ON "PracticeSession"("jobId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupProfile" ADD CONSTRAINT "SetupProfile_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GapAnalysis" ADD CONSTRAINT "GapAnalysis_setupProfileId_fkey" FOREIGN KEY ("setupProfileId") REFERENCES "SetupProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
