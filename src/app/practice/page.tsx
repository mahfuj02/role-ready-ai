import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { submitAnswerAction } from "./actions";

type PracticePageProps = {
  searchParams: Promise<{ session?: string; saved?: string; error?: string }>;
};

export default async function PracticePage({ searchParams }: PracticePageProps) {
  const user = await requireUser();
  const params = await searchParams;

  if (!user.email) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, currentJobId: true },
  });

  if (!dbUser) {
    return null;
  }

  const currentSession = await prisma.practiceSession.findFirst({
    where: {
      userId: dbUser.id,
      ...(dbUser.currentJobId ? { jobId: dbUser.currentJobId } : { jobId: null }),
      ...(params.session ? { id: params.session } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      questions: {
        orderBy: { position: "asc" },
      },
      answers: {
        orderBy: { updatedAt: "desc" },
      },
      setupProfile: {
        select: {
          roleTitle: true,
          seniority: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Practice</h1>

      {params.error === "validation" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Answer must be at least 20 characters.
        </p>
      )}

      {params.error === "not-found" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Could not save answer for this session. Try generating a new practice session.
        </p>
      )}

      {!currentSession && (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-slate-700">
            No practice session found yet. Generate questions from setup to begin.
          </p>
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
              {currentSession.questions.length} questions generated. Submit your answers to unlock
              feedback and STAR coaching.
            </p>
            <div className="mt-4">
              <Link
                href={`/feedback?session=${currentSession.id}`}
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                View feedback for this session
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">Questions</h3>
            <ol className="mt-3 space-y-3">
              {currentSession.questions.map((question) => {
                const existingAnswer = currentSession.answers.find(
                  (answer) => answer.questionId === question.id,
                );

                return (
                <li key={question.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-500">
                    Q{question.position} · {question.type.toLowerCase()} · {question.difficulty.toLowerCase()}
                  </p>
                  <p className="mt-1 text-slate-900">{question.text}</p>

                  {params.saved === question.id && (
                    <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      Answer saved and evaluated.
                    </p>
                  )}

                  <form action={submitAnswerAction} className="mt-3 space-y-3">
                    <input type="hidden" name="practiceSessionId" value={currentSession.id} />
                    <input type="hidden" name="questionId" value={question.id} />
                    <textarea
                      name="answerText"
                      required
                      minLength={20}
                      defaultValue={existingAnswer?.text ?? ""}
                      rows={5}
                      placeholder="Type your interview answer..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 outline-none ring-teal-300 transition focus:ring"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Save answer
                    </button>
                  </form>
                </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}
    </main>
  );
}
