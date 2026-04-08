import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

type PracticePageProps = {
  searchParams: Promise<{ session?: string }>;
};

export default async function PracticePage({ searchParams }: PracticePageProps) {
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
      questions: {
        orderBy: { position: "asc" },
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
              {currentSession.questions.length} questions generated. Next step is answer submission and
              scoring.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-900">Questions</h3>
            <ol className="mt-3 space-y-3">
              {currentSession.questions.map((question) => (
                <li key={question.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-500">
                    Q{question.position} · {question.type.toLowerCase()} · {question.difficulty.toLowerCase()}
                  </p>
                  <p className="mt-1 text-slate-900">{question.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </main>
  );
}
