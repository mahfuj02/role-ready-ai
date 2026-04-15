import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Logo } from "@/components/logo";
import { PracticeAnswerInput, QuestionsLoading } from "./practice-client";

type Props = {
  searchParams: Promise<{ session?: string; q?: string }>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Scores are 0–5; convert to 0–100 % */
function toPercent(score: number) {
  return Math.round(score * 20);
}

function avgScorePercent(feedbacks: { relevance: number; clarity: number; depth: number; communication: number }[]) {
  if (feedbacks.length === 0) return null;
  const total = feedbacks.reduce(
    (sum, f) => sum + f.relevance + f.clarity + f.depth + f.communication,
    0,
  );
  return Math.round((total / (feedbacks.length * 4)) * 20);
}

function scoreColor(pct: number) {
  if (pct >= 80) return "text-green-600";
  if (pct >= 60) return "text-teal-600";
  if (pct >= 40) return "text-amber-500";
  return "text-red-500";
}

// ── STAR circles row ──────────────────────────────────────────────────────────

type StarAnalysisShape = {
  situation: boolean; situationEvidence: string;
  task: boolean;      taskEvidence: string;
  action: boolean;    actionEvidence: string;
  result: boolean;    resultEvidence: string;
  coachTip: string;
};

function StarCircles({ star }: { star: StarAnalysisShape }) {
  const parts = [
    { letter: "S", label: "Situation", present: star.situation, evidence: star.situationEvidence },
    { letter: "T", label: "Task",      present: star.task,      evidence: star.taskEvidence },
    { letter: "A", label: "Action",    present: star.action,    evidence: star.actionEvidence },
    { letter: "R", label: "Result",    present: star.result,    evidence: star.resultEvidence },
  ];

  return (
    <div className="mb-4">
      {/* Circle row */}
      <div className="flex items-center justify-around">
        {parts.map(({ letter, label, present }) => (
          <div key={letter} className="flex flex-col items-center gap-1.5">
            <div className={[
              "flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold shadow-sm",
              present ? "bg-green-500 text-white" : "bg-red-100 text-red-500 ring-2 ring-red-200",
            ].join(" ")}>
              {letter}
            </div>
            <span className={`text-[10px] font-semibold ${present ? "text-green-600" : "text-red-400"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Evidence for missing parts */}
      {parts.filter(p => !p.present && p.evidence).map(({ letter, label, evidence }) => (
        <div key={letter} className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide mb-0.5">{label} missing</p>
          <p className="text-xs leading-relaxed text-red-700">{evidence}</p>
        </div>
      ))}

      {/* Coach tip */}
      {star.coachTip && (
        <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">Coach tip</p>
          <p className="text-xs leading-relaxed text-amber-800">{star.coachTip}</p>
        </div>
      )}
    </div>
  );
}

// ── Score row with specific reason ────────────────────────────────────────────

function ScoreRow({ label, score, why }: { label: string; score: number; why: string }) {
  const pct = toPercent(score);
  const barColor =
    pct >= 80 ? "#22c55e" :
    pct >= 60 ? "#14b8a6" :
    pct >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700">{label}</span>
        <span className={`text-xs font-extrabold ${scoreColor(pct)}`}>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      {why && (
        <p className="text-[11px] leading-relaxed text-slate-500 pt-0.5">{why}</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PracticePage({ searchParams }: Props) {
  const params = await searchParams;

  const session = await auth();
  if (!session?.user?.email) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!dbUser) redirect("/sign-in");

  // ── Load practice session ─────────────────────────────────────────────────

  const practiceSession = await prisma.practiceSession.findFirst({
    where: {
      userId: dbUser.id,
      ...(params.session ? { id: params.session } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      questions: { orderBy: { position: "asc" } },
      answers: {
        include: { feedback: true, starAnalysis: true },
      },
      setupProfile: { select: { roleTitle: true, seniority: true } },
      job: { select: { name: true } },
    },
  });

  if (!practiceSession) redirect("/");

  const questions = practiceSession.questions;
  if (questions.length === 0) {
    return <QuestionsLoading sessionId={practiceSession.id} />;
  }

  // ── Resolve current question ──────────────────────────────────────────────

  const currentQ = params.q
    ? (questions.find((q) => q.id === params.q) ?? questions[0])
    : (questions.find((q) => !practiceSession.answers.some((a) => a.questionId === q.id)) ?? questions[0]);

  const currentIdx  = questions.indexOf(currentQ);
  const prevQ       = currentIdx > 0 ? questions[currentIdx - 1] : null;
  const nextQ       = currentIdx < questions.length - 1 ? questions[currentIdx + 1] : null;

  const existingAnswer = practiceSession.answers.find((a) => a.questionId === currentQ.id) ?? null;
  const feedback       = existingAnswer?.feedback ?? null;
  const starAnalysis   = existingAnswer?.starAnalysis ?? null;

  // ── Stats ─────────────────────────────────────────────────────────────────

  const answeredIds  = new Set(practiceSession.answers.map((a) => a.questionId));
  const doneCount    = answeredIds.size;
  const leftCount    = questions.length - doneCount;
  const avgPct       = avgScorePercent(
    practiceSession.answers.map((a) => a.feedback).filter(Boolean) as {
      relevance: number; clarity: number; depth: number; communication: number;
    }[],
  );

  // ── Job label ─────────────────────────────────────────────────────────────

  const jobName       = practiceSession.job?.name ?? practiceSession.setupProfile.roleTitle;
  const jobParts      = jobName.split(" - ");
  const company       = jobParts.length > 1 ? jobParts[0] : null;
  const role          = jobParts.length > 1 ? jobParts.slice(1).join(" - ") : jobName;

  const isBehavioral  = currentQ.type === "BEHAVIORAL";

  async function handleSignOut() { "use server"; await signOut({ redirectTo: "/" }); }

  const displayName =
    session.user.name?.split(" ").filter(Boolean).slice(0, 2)
      .map((p, i) => (i === 0 ? p : p[0] + ".")).join(" ") || "User";
  const initials =
    session.user.name?.split(" ").filter(Boolean).slice(0, 2)
      .map((p) => p[0]?.toUpperCase()).join("") || "U";

  const baseUrl = `/practice?session=${practiceSession.id}`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4F8" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-cyan-900/40 bg-[#071f3f]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
          <Logo />
          {/* Centre: job label */}
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-400">
            <span className="text-slate-500">Practising:</span>
            {company && <><span className="text-slate-300 font-medium">{company}</span><span>·</span></>}
            <span className="text-slate-300 font-medium">{role}</span>
          </div>
          <ProfileDropdown displayName={displayName} initials={initials} signOutAction={handleSignOut} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">

        {/* ── Progress card ── */}
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: question label + badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold text-slate-800">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className={[
                "rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide",
                isBehavioral ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700",
              ].join(" ")}>
                {isBehavioral ? "Behavioural" : "Technical"}
              </span>
              {currentQ.starRecommended && (
                <span className="flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-[10px] font-extrabold text-red-600">
                  ▶ Gap-related
                </span>
              )}
            </div>
            {/* Right: stats */}
            <div className="flex items-center divide-x divide-slate-100">
              {avgPct !== null && (
                <div className="pr-5 text-center">
                  <p className={`text-lg font-extrabold ${scoreColor(avgPct)}`}>{avgPct}%</p>
                  <p className="text-[10px] text-slate-400">Avg score</p>
                </div>
              )}
              <div className="px-5 text-center">
                <p className="text-lg font-extrabold text-slate-800">{doneCount}</p>
                <p className="text-[10px] text-slate-400">Done</p>
              </div>
              <div className="pl-5 text-center">
                <p className="text-lg font-extrabold text-slate-400">{leftCount}</p>
                <p className="text-[10px] text-slate-400">Left</p>
              </div>
            </div>
          </div>

          {/* Progress dots */}
          <div className="mt-3 flex flex-wrap gap-1">
            {questions.map((q) => {
              const answered = answeredIds.has(q.id);
              const isCurrent = q.id === currentQ.id;
              return (
                <Link key={q.id} href={`${baseUrl}&q=${q.id}`}>
                  <span className={[
                    "block h-2 w-2 rounded-full transition",
                    isCurrent
                      ? "bg-teal-500 ring-2 ring-teal-300 ring-offset-1"
                      : answered
                        ? "bg-teal-400"
                        : "bg-slate-200 hover:bg-slate-300",
                  ].join(" ")} />
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">

          {/* ── Left: question + input — key forces remount + animation on every question change ── */}
          <div key={currentQ.id} className="animate-slide-in space-y-4">

            {/* Question card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full text-white text-xs" style={{ background: "var(--brand-teal)" }}>✦</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600">Your question</span>
              </div>
              <p className="text-lg font-bold leading-snug text-slate-900">&ldquo;{currentQ.text}&rdquo;</p>

              {/* STAR tip for behavioural */}
              {isBehavioral && (
                <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
                  <p className="mb-1 text-xs font-extrabold text-teal-600">◎ STAR tip</p>
                  <p className="text-xs leading-relaxed text-teal-700">
                    Structure your answer: <strong>Situation</strong> → <strong>Task</strong> → <strong>Action</strong> → <strong>Result</strong>.
                    Include a specific metric in your result.
                  </p>
                </div>
              )}
            </div>

            {/* Answer input */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <PracticeAnswerInput
                key={currentQ.id}
                sessionId={practiceSession.id}
                questionId={currentQ.id}
                existingAnswer={existingAnswer?.text ?? null}
              />
            </div>

          </div>

          {/* ── Right: feedback + guide ── */}
          <div className="space-y-4">

            {/* STAR / score feedback */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">Answer feedback</h2>
                {!feedback && <span className="text-xs text-slate-400">After you answer</span>}
              </div>

              {!feedback ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-300">
                    {isBehavioral ? "✦" : "◎"}
                  </span>
                  <p className="text-sm font-semibold text-slate-500">Feedback appears here</p>
                  <p className="text-xs leading-relaxed text-slate-400">
                    Submit your answer and we&apos;ll give you{" "}
                    {isBehavioral
                      ? "STAR structure analysis and detailed scores."
                      : "detailed scores with specific feedback."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">

                  {/* STAR circles — behavioural only */}
                  {isBehavioral && starAnalysis && (
                    <StarCircles star={starAnalysis} />
                  )}

                  {/* Divider between STAR and scores */}
                  {isBehavioral && starAnalysis && (
                    <div className="border-t border-slate-100" />
                  )}

                  {/* Score rows with specific reasons */}
                  <div className="space-y-3">
                    <ScoreRow label="Relevance"     score={feedback.relevance}     why={feedback.relevanceWhy} />
                    <ScoreRow label="Clarity"       score={feedback.clarity}       why={feedback.clarityWhy} />
                    <ScoreRow label="Depth"         score={feedback.depth}         why={feedback.depthWhy} />
                    <ScoreRow label="Communication" score={feedback.communication} why={feedback.communicationWhy} />
                  </div>

                  {/* Improvement tips */}
                  {(feedback.tipOne || feedback.tipTwo) && (
                    <div className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-3 space-y-1.5">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600">How to improve</p>
                      {feedback.tipOne && <p className="text-xs leading-relaxed text-teal-800">• {feedback.tipOne}</p>}
                      {feedback.tipTwo && <p className="text-xs leading-relaxed text-teal-800">• {feedback.tipTwo}</p>}
                    </div>
                  )}

                  {/* Model answer */}
                  {feedback.improvedAnswer && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">Model answer</p>
                      <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-line">{feedback.improvedAnswer}</p>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* STAR structure guide — always visible */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm text-teal-500">◎</span>
                <h3 className="text-sm font-bold text-slate-800">STAR structure guide</h3>
              </div>
              <div className="space-y-3">
                {[
                  { l: "S", color: "bg-blue-500",   label: "Situation", desc: "Set the scene. Where were you, what was the context?" },
                  { l: "T", color: "bg-teal-500",   label: "Task",      desc: "What was your specific responsibility or goal?" },
                  { l: "A", color: "bg-amber-500",  label: "Action",    desc: 'What did YOU do? Be specific, use "I" not "we".' },
                  { l: "R", color: "bg-green-500",  label: "Result",    desc: "What was the measurable outcome? Always add a number." },
                ].map(({ l, color, label, desc }) => (
                  <div key={l} className="flex gap-3">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white ${color}`}>{l}</span>
                    <p className="text-xs leading-relaxed text-slate-600">
                      <strong className="text-slate-800">{label}</strong> — {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ── Bottom navigation ── */}
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
          {/* Previous */}
          {prevQ ? (
            <Link
              href={`${baseUrl}&q=${prevQ.id}`}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:border-slate-300"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}

          {/* Centre: skip */}
          {nextQ && (
            <Link
              href={`${baseUrl}&q=${nextQ.id}`}
              className="text-sm font-medium text-slate-400 transition hover:text-slate-600"
            >
              Skip →
            </Link>
          )}

          {/* Next (primary after answering) */}
          {nextQ ? (
            <Link
              href={`${baseUrl}&q=${nextQ.id}`}
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
              style={{ background: feedback ? "var(--brand-teal)" : "#94a3b8" }}
            >
              Next question →
            </Link>
          ) : feedback ? (
            <Link
              href={`/session?id=${practiceSession.id}`}
              className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
              style={{ background: "var(--brand-teal)" }}
            >
              Finish session ✓
            </Link>
          ) : (
            <span />
          )}
        </div>

      </main>
    </div>
  );
}
