import { NextResponse, NextRequest } from "next/server";
import { evaluateAnswerWithSource } from "@/lib/ai/answer-evaluator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await evaluateAnswerWithSource({
      question: body.question || "What is your greatest strength?",
      questionType: body.questionType || "BEHAVIORAL",
      answerText:
        body.answerText ||
        "I led a team that improved performance by 30% by implementing new processes.",
      roleTitle: body.roleTitle || "Software Engineer",
      resumeText: body.resumeText || "Experience in full-stack development",
      jobDescriptionText:
        body.jobDescriptionText || "Looking for experienced software engineer",
    });

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "",
      },
      { status: 500 }
    );
  }
}
