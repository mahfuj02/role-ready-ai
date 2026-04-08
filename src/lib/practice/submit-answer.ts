import { QuestionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { detectStar, evaluateAnswer } from "@/lib/ai/answer-evaluator";

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
  const evaluation = await evaluateAnswer({
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

  await prisma.feedback.upsert({
    where: { answerId: answer.id },
    update: {
      relevance: evaluation.scores.relevance,
      clarity: evaluation.scores.clarity,
      depth: evaluation.scores.depth,
      communication: evaluation.scores.communication,
      relevanceWhy: evaluation.reasons.relevance,
      clarityWhy: evaluation.reasons.clarity,
      depthWhy: evaluation.reasons.depth,
      communicationWhy: evaluation.reasons.communication,
      tipOne: evaluation.improvementTips[0],
      tipTwo: evaluation.improvementTips[1],
      improvedAnswer: evaluation.improvedAnswer,
    },
    create: {
      answerId: answer.id,
      relevance: evaluation.scores.relevance,
      clarity: evaluation.scores.clarity,
      depth: evaluation.scores.depth,
      communication: evaluation.scores.communication,
      relevanceWhy: evaluation.reasons.relevance,
      clarityWhy: evaluation.reasons.clarity,
      depthWhy: evaluation.reasons.depth,
      communicationWhy: evaluation.reasons.communication,
      tipOne: evaluation.improvementTips[0],
      tipTwo: evaluation.improvementTips[1],
      improvedAnswer: evaluation.improvedAnswer,
    },
  });

  if (question.type === QuestionType.BEHAVIORAL) {
    const star = await detectStar(trimmedAnswer, question.text);

    await prisma.starAnalysis.upsert({
      where: { answerId: answer.id },
      update: {
        situation: star.situation.present,
        task: star.task.present,
        action: star.action.present,
        result: star.result.present,
        situationEvidence: star.situation.evidence,
        taskEvidence: star.task.evidence,
        actionEvidence: star.action.evidence,
        resultEvidence: star.result.evidence,
        coachTip: star.coachTip,
      },
      create: {
        answerId: answer.id,
        situation: star.situation.present,
        task: star.task.present,
        action: star.action.present,
        result: star.result.present,
        situationEvidence: star.situation.evidence,
        taskEvidence: star.task.evidence,
        actionEvidence: star.action.evidence,
        resultEvidence: star.result.evidence,
        coachTip: star.coachTip,
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
