import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

type FeedbackPageProps = {
  searchParams: Promise<{ session?: string }>;
};

export default async function FeedbackPage({ searchParams }: FeedbackPageProps) {
  const user = await requireUser();
  const params = await searchParams;

  if (!user.email) {
    return null;
  }

  const currentSession = await prisma.practiceSession.findFirst({
    where: {
      user: { email: user.email },
      ...(params.session ? { id: params.session } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      setupProfile: {
        select: {
          roleTitle: true,
          seniority: true,
        },
      },
      questions: {
        orderBy: { position: "asc" },
        include: {
          answers: {
            orderBy: { updatedAt: "desc" },
            include: {
              feedback: true,
              starAnalysis: true,
            },
          },
        },
      },
    },
  });

  const answeredCount =
    currentSession?.questions.filter((question) => question.answers[0]?.feedback).length ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Feedback</h1>

      {!currentSession && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-slate-700">No practice session found yet.</p>
          <Link
            href="/setup"
            className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Go to setup
          </Link>
        </div>
      )}

      {currentSession && (
        <section className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-600">Session #{currentSession.id.slice(0, 8)}</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {currentSession.setupProfile.roleTitle} ({currentSession.setupProfile.seniority})
            </h2>
            <p className="mt-1 text-slate-700">
              Evaluated answers: {answeredCount}/{currentSession.totalQuestions}
            </p>
            <p className="mt-1 text-slate-700">
              STAR completion: {currentSession.starCompletionPct ?? 0}%
            </p>
          </div>

          {currentSession.questions.map((question) => {
            const latestAnswer = question.answers[0];
            const feedback = latestAnswer?.feedback;
            const star = latestAnswer?.starAnalysis;

            return (
              <article key={question.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm font-medium text-slate-500">
                  Q{question.position} · {question.type.toLowerCase()} · {question.difficulty.toLowerCase()}
                </p>
                <p className="mt-1 text-slate-900">{question.text}</p>

                {!latestAnswer && (
                  <p className="mt-3 text-sm text-amber-700">
                    No answer submitted yet. Add your answer in Practice.
                  </p>
                )}

                {latestAnswer && !feedback && (
                  <p className="mt-3 text-sm text-amber-700">
                    Answer exists, but no feedback generated yet.
                  </p>
                )}

                {feedback && (
                  <div className="mt-4 grid gap-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide">
                      <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-slate-700">
                        Feedback source: {feedback.provider === "GEMINI" ? "Gemini" : "Mock fallback"}
                      </span>
                      {star && question.type === "BEHAVIORAL" && (
                        <span className="rounded-full border border-teal-300 bg-teal-50 px-2 py-1 text-teal-700">
                          STAR source: {star.provider === "GEMINI" ? "Gemini" : "Mock fallback"}
                        </span>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs uppercase text-slate-500">Relevance</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">{feedback.relevance}/5</p>
                        <p className="mt-1 text-sm text-slate-700">{feedback.relevanceWhy}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs uppercase text-slate-500">Clarity</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">{feedback.clarity}/5</p>
                        <p className="mt-1 text-sm text-slate-700">{feedback.clarityWhy}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs uppercase text-slate-500">Depth</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">{feedback.depth}/5</p>
                        <p className="mt-1 text-sm text-slate-700">{feedback.depthWhy}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-3">
                        <p className="text-xs uppercase text-slate-500">Communication</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">
                          {feedback.communication}/5
                        </p>
                        <p className="mt-1 text-sm text-slate-700">{feedback.communicationWhy}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs uppercase text-slate-500">Improvement tips</p>
                      <ul className="mt-2 list-disc pl-5 text-sm text-slate-800">
                        <li>{feedback.tipOne}</li>
                        <li>{feedback.tipTwo}</li>
                      </ul>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs uppercase text-slate-500">Improved sample answer</p>
                      <p className="mt-2 text-sm text-slate-800">{feedback.improvedAnswer}</p>
                    </div>

                    {question.type === "BEHAVIORAL" && star && (
                      <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
                        <p className="text-xs uppercase text-teal-700">STAR analysis</p>
                        <p className="mt-2 text-sm text-teal-900">
                          Situation: {star.situation ? "yes" : "no"} · Task: {star.task ? "yes" : "no"}
                          {" "}· Action: {star.action ? "yes" : "no"} · Result: {star.result ? "yes" : "no"}
                        </p>
                        <p className="mt-2 text-sm text-teal-900">Coach tip: {star.coachTip}</p>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
