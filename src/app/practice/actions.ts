"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { submitPracticeAnswer } from "@/lib/practice/submit-answer";

export async function submitAnswerAction(formData: FormData) {
  const user = await requireUser();

  if (!user.email) {
    redirect("/sign-in");
  }

  const practiceSessionId = String(formData.get("practiceSessionId") ?? "").trim();
  const questionId = String(formData.get("questionId") ?? "").trim();
  const answerText = String(formData.get("answerText") ?? "").trim();

  if (!practiceSessionId || !questionId || answerText.length < 20) {
    redirect(`/practice?session=${practiceSessionId}&error=validation`);
  }

  const saved = await submitPracticeAnswer({
    email: user.email,
    practiceSessionId,
    questionId,
    answerText,
  });

  if (!saved) {
    redirect(`/practice?session=${practiceSessionId}&error=not-found`);
  }

  redirect(`/practice?session=${practiceSessionId}&saved=${questionId}`);
}
