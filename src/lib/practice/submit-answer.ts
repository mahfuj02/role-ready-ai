import { QuestionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { evaluateAnswerWithSource } from "@/lib/ai/answer-evaluator";
import { detectMockStar } from "@/lib/ai/mock-answer-evaluator";

type SubmitPracticeAnswerInput = {
  email: string;
  practiceSessionId: string;
  questionId: string;
  answerText: string;
};

export async function submitPracticeAnswer(input: SubmitPracticeAnswerInput): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (!user) {
    return false;
  }

  const question = await prisma.question.findFirst({
    where: {
      id: input.questionId,
      practiceSessionId: input.practiceSessionId,
      practiceSession: {
        userId: user.id,
      },
    },
    include: {
      practiceSession: {
        include: {
          setupProfile: {
            select: {
              roleTitle: true,
              resumeText: true,
              jobDescriptionText: true,
            },
          },
        },
      },
    },
  });

  if (!question) {
    return false;
  }

  const trimmedAnswer = input.answerText.trim();
  const evaluation = await evaluateAnswerWithSource({
    question: question.text,
    questionType: question.type,
    answerText: trimmedAnswer,
    roleTitle: question.practiceSession.setupProfile.roleTitle,
    resumeText: question.practiceSession.setupProfile.resumeText,
    jobDescriptionText: question.practiceSession.setupProfile.jobDescriptionText,
  });

  const existingAnswer = await prisma.answer.findFirst({
    where: {
      practiceSessionId: input.practiceSessionId,
      questionId: question.id,
    },
    select: {
      id: true,
    },
  });

  const answer = existingAnswer
    ? await prisma.answer.update({
        where: { id: existingAnswer.id },
        data: { text: trimmedAnswer },
      })
    : await prisma.answer.create({
        data: {
          practiceSessionId: input.practiceSessionId,
          questionId: question.id,
          text: trimmedAnswer,
        },
      });

  const tips = evaluation.result.improvementTips;
  const tipOne = tips[0] || "Keep practicing this type of question.";
  const tipTwo = tips[1] || "Focus on areas for continued improvement.";

  await prisma.feedback.upsert({
    where: { answerId: answer.id },
    update: {
      provider: evaluation.provider,
      relevance: evaluation.result.scores.relevance,
      clarity: evaluation.result.scores.clarity,
      depth: evaluation.result.scores.depth,
      communication: evaluation.result.scores.communication,
      relevanceWhy: evaluation.result.reasons.relevance,
      clarityWhy: evaluation.result.reasons.clarity,
      depthWhy: evaluation.result.reasons.depth,
      communicationWhy: evaluation.result.reasons.communication,
      tipOne,
      tipTwo,
      improvedAnswer: evaluation.result.improvedAnswer,
    },
    create: {
      answerId: answer.id,
      provider: evaluation.provider,
      relevance: evaluation.result.scores.relevance,
      clarity: evaluation.result.scores.clarity,
      depth: evaluation.result.scores.depth,
      communication: evaluation.result.scores.communication,
      relevanceWhy: evaluation.result.reasons.relevance,
      clarityWhy: evaluation.result.reasons.clarity,
      depthWhy: evaluation.result.reasons.depth,
      communicationWhy: evaluation.result.reasons.communication,
      tipOne,
      tipTwo,
      improvedAnswer: evaluation.result.improvedAnswer,
    },
  });

  if (question.type === QuestionType.BEHAVIORAL) {
    const star = evaluation.result.star ?? {
      situation: { present: false, evidence: "" },
      task: { present: false, evidence: "" },
      action: { present: false, evidence: "" },
      result: { present: false, evidence: "" },
      missingParts: ["situation", "task", "action", "result"] as const,
      coachTip: "",
    };

    const starFallback = evaluation.provider === "MOCK" && !evaluation.result.star
      ? detectMockStar(trimmedAnswer)
      : null;

    const finalStar = evaluation.provider === "MOCK" && starFallback
      ? starFallback
      : star;

    await prisma.starAnalysis.upsert({
      where: { answerId: answer.id },
      update: {
        provider: evaluation.provider,
        situation: finalStar.situation.present,
        task: finalStar.task.present,
        action: finalStar.action.present,
        result: finalStar.result.present,
        situationEvidence: finalStar.situation.evidence,
        taskEvidence: finalStar.task.evidence,
        actionEvidence: finalStar.action.evidence,
        resultEvidence: finalStar.result.evidence,
        coachTip: finalStar.coachTip,
      },
      create: {
        answerId: answer.id,
        provider: evaluation.provider,
        situation: finalStar.situation.present,
        task: finalStar.task.present,
        action: finalStar.action.present,
        result: finalStar.result.present,
        situationEvidence: finalStar.situation.evidence,
        taskEvidence: finalStar.task.evidence,
        actionEvidence: finalStar.action.evidence,
        resultEvidence: finalStar.result.evidence,
        coachTip: finalStar.coachTip,
      },
    });
  }

  const behavioralAnswers = await prisma.answer.findMany({
    where: {
      practiceSessionId: input.practiceSessionId,
      question: {
        type: QuestionType.BEHAVIORAL,
      },
      starAnalysis: {
        isNot: null,
      },
    },
    include: {
      starAnalysis: true,
    },
  });

  if (behavioralAnswers.length > 0) {
    const totalPct = behavioralAnswers.reduce((sum, row) => {
      if (!row.starAnalysis) return sum;
      const completeParts = [
        row.starAnalysis.situation,
        row.starAnalysis.task,
        row.starAnalysis.action,
        row.starAnalysis.result,
      ].filter(Boolean).length;

      return sum + (completeParts / 4) * 100;
    }, 0);

    await prisma.practiceSession.update({
      where: { id: input.practiceSessionId },
      data: {
        starCompletionPct: Math.round((totalPct / behavioralAnswers.length) * 100) / 100,
      },
    });
  }

  const answeredCount = await prisma.answer.count({
    where: { practiceSessionId: input.practiceSessionId },
  });

  if (answeredCount >= question.practiceSession.totalQuestions) {
    await prisma.practiceSession.update({
      where: { id: input.practiceSessionId },
      data: {
        completedAt: new Date(),
      },
    });
  }

  return true;
}
