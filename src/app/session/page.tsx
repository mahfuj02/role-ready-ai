import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Logo } from "@/components/logo";

type Props = { searchParams: Promise<{ id?: string }> };

// ── Helpers ───────────────────────────────────────────────────────────────────

function toPercent(score: number) { return Math.round(score * 20); }

function avgFeedback(f: { relevance: number; clarity: number; depth: number; communication: number }) {
  return toPercent((f.relevance + f.clarity + f.depth + f.communication) / 4);
}

function starLabel(pct: number): { text: string; cls: string } {
  if (pct >= 85) return { text: "Strong", cls: "text-green-600" };
  if (pct >= 70) return { text: "Good",   cls: "text-teal-600" };
  if (pct >= 55) return { text: "Ok",     cls: "text-amber-500" };
  return               { text: "Weak",   cls: "text-red-500" };
}

function duration(from: Date, to: Date) {
  const mins = Math.round((to.getTime() - from.getTime()) / 60000);
  if (mins < 1)  return "< 1 min";
  if (mins < 60) return `${mins} min session`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m session`;
}

function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60)   return "Completed just now";
  if (s < 3600) return `Completed ${Math.floor(s / 60)} mins ago`;
  return `Completed ${Math.floor(s / 3600)} hrs ago`;
}

// ── ScoreRing ─────────────────────────────────────────────────────────────────

function ScoreRing({ pct, size = 72 }: { pct: number; size?: number }) {
  const r = 28, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
  const color = pct >= 75 ? "#22c55e" : pct >= 55 ? "#0E7C86" : pct >= 40 ? "#F4BB42" : "#ef4444";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-base font-extrabold text-white">{pct}%</span>
    </div>
  );
}

// ── STAR circle ───────────────────────────────────────────────────────────────

function StarCircle({ letter, pct, color }: { letter: string; pct: number; color: string }) {
  const { text, cls } = starLabel(pct);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="5" />
          <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${(pct / 100) * 2 * Math.PI * 28} ${(1 - pct / 100) * 2 * Math.PI * 28}`}
            strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-extrabold" style={{ color }}>{letter}</span>
          <span className="text-xs font-bold text-slate-700">{pct}%</span>
        </span>
      </div>
      <span className={`text-xs font-bold ${cls}`}>{text}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SessionSummaryPage({ searchParams }: Props) {
  const params = await searchParams;
  if (!params.id) redirect("/");

  const session = await auth();
  if (!session?.user?.email) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!dbUser) redirect("/sign-in");

  const ps = await prisma.practiceSession.findFirst({
    where: { id: params.id, userId: dbUser.id },
    include: {
      questions: { orderBy: { position: "asc" } },
      answers: {
        include: { feedback: true, starAnalysis: true, question: true },
      },
      setupProfile: { select: { roleTitle: true, seniority: true } },
      job: { select: { id: true, name: true } },
    },
  });
  if (!ps) redirect("/");

  // ── Previous session for improvement delta ──────────────────────────────────
  const prevSession = await prisma.practiceSession.findFirst({
    where: { userId: dbUser.id, id: { not: ps.id }, jobId: ps.job?.id ?? undefined },
    orderBy: { createdAt: "desc" },
    include: { answers: { include: { feedback: true } } },
  });

  // ── Derived stats ───────────────────────────────────────────────────────────

  type PsAnswer = typeof ps.answers[number];
  type PsQuestion = typeof ps.questions[number];

  const answeredIds  = new Set(ps.answers.map((a: PsAnswer) => a.questionId));
  const skipped      = ps.questions.filter((q: PsQuestion) => !answeredIds.has(q.id));
  const doneCount    = ps.answers.length;
  const totalCount   = ps.questions.length;

  const answersWithFeedback = ps.answers.filter((a: PsAnswer) => a.feedback);
  const avgScore = answersWithFeedback.length
    ? Math.round(answersWithFeedback.reduce((s, a: PsAnswer) => s + avgFeedback(a.feedback!), 0) / answersWithFeedback.length)
    : 0;

  type PrevAnswer = NonNullable<typeof prevSession>["answers"][number];
  const prevAvg = prevSession && prevSession.answers.filter((a: PrevAnswer) => a.feedback).length
    ? Math.round(
        prevSession.answers.filter((a: PrevAnswer) => a.feedback)
          .reduce((s: number, a: PrevAnswer) => s + avgFeedback(a.feedback!), 0) /
        prevSession.answers.filter((a: PrevAnswer) => a.feedback).length
      )
    : null;
  const delta = prevAvg !== null ? avgScore - prevAvg : null;

  const behavioralWithStar = ps.answers.filter((a: PsAnswer) => a.starAnalysis);
  const starAvg = (part: "situation" | "task" | "action" | "result") =>
    behavioralWithStar.length
      ? Math.round(
          (behavioralWithStar.filter((a: PsAnswer) => a.starAnalysis![part]).length / behavioralWithStar.length) * 100
        )
      : 0;

  const sStar = starAvg("situation");
  const tStar = starAvg("task");
  const aStar = starAvg("action");
  const rStar = starAvg("result");
  const overallStar = behavioralWithStar.length
    ? Math.round((sStar + tStar + aStar + rStar) / 4)
    : 0;

  const starParts = { Situation: sStar, Task: tStar, Action: aStar, Result: rStar };
  const strongest = Object.entries(starParts).sort((a, b) => b[1] - a[1])[0];
  const weakest   = Object.entries(starParts).sort((a, b) => a[1] - b[1])[0];

  const sortedByScore = [...answersWithFeedback].sort(
    (a, b) => avgFeedback(b.feedback!) - avgFeedback(a.feedback!),
  );
  const bestAnswer  = sortedByScore[0] ?? null;
  const worstAnswer = sortedByScore[sortedByScore.length - 1] ?? null;

  const finishedAt = ps.completedAt ?? new Date();
  const sessionDur = duration(ps.createdAt, finishedAt);

  // Job label
  const jobName   = ps.job?.name ?? ps.setupProfile.roleTitle;
  const parts     = jobName.split(" - ");
  const company   = parts.length > 1 ? parts[0] : null;
  const role      = ps.setupProfile.roleTitle || jobName;

  const displayName =
    session.user.name?.split(" ").filter(Boolean).slice(0, 2)
      .map((p, i) => (i === 0 ? p : p[0] + ".")).join(" ") || "User";
  const initials =
    session.user.name?.split(" ").filter(Boolean).slice(0, 2)
      .map((p) => p[0]?.toUpperCase()).join("") || "U";

  async function handleSignOut() { "use server"; await signOut({ redirectTo: "/" }); }

  const firstSkippedId = skipped[0]?.id;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4F8" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-cyan-900/40 bg-[#071f3f]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
          <Logo />
          <ProfileDropdown displayName={displayName} initials={initials} signOutAction={handleSignOut} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 space-y-5">

        {/* ── Hero ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
          style={{ background: "linear-gradient(135deg, #071f3f 0%, #0a3060 100%)" }}
        >
          {/* Top row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 text-3xl">🎉</div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Session <span style={{ color: "var(--brand-teal)" }}>complete!</span>
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {company && <>{company} · </>}{role} · {timeAgo(finishedAt)}
              </p>
              {/* Quick stats badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-300 border border-teal-500/30">
                  <span>✓</span> {doneCount} answered
                </span>
                {skipped.length > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/30">
                    <span>⊘</span> {skipped.length} skipped
                  </span>
                )}
                <span className="flex items-center gap-1.5 rounded-full bg-slate-500/20 px-3 py-1 text-xs font-semibold text-slate-400 border border-slate-500/30">
                  <span>⏱</span> {sessionDur}
                </span>
              </div>
            </div>

            {/* Score ring */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <ScoreRing pct={avgScore} size={80} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Avg score</span>
              {delta !== null && (
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                  delta >= 0
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : "bg-red-500/20 text-red-300 border-red-500/30"
                }`}>
                  {delta >= 0 ? "+" : ""}{delta}% from last session
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── 4 stat cards ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Questions done",
              big: <span className="text-slate-800">{doneCount}<span className="text-xl text-slate-400">/{totalCount}</span></span>,
              sub: `${skipped.length} skipped`,
              bar: "bg-teal-500",
              barPct: Math.round((doneCount / totalCount) * 100),
            },
            {
              label: "Avg STAR score",
              big: <span style={{ color: "var(--brand-teal)" }}>{avgScore}%</span>,
              sub: delta !== null ? `${delta >= 0 ? "+" : ""}${delta}% improvement` : "First session",
              bar: "bg-teal-500",
              barPct: avgScore,
            },
            {
              label: "Strongest area",
              big: <span className="text-green-600">{strongest[0]}</span>,
              sub: `Avg ${strongest[1]}% across answers`,
              bar: "bg-green-400",
              barPct: strongest[1],
            },
            {
              label: "Weakest area",
              big: <span className="text-red-500">{weakest[0]}</span>,
              sub: `Avg ${weakest[1]}% — needs work`,
              bar: "bg-red-400",
              barPct: weakest[1],
            },
          ].map((c) => (
            <div key={c.label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{c.label}</p>
              <div className="text-2xl font-extrabold leading-none">{c.big}</div>
              <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
                <div className={`h-full ${c.bar} transition-all`} style={{ width: `${c.barPct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── STAR breakdown + Key insights ── */}
        {behavioralWithStar.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">

            {/* STAR breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">STAR breakdown</h2>
                <span className="text-xs font-bold" style={{ color: "var(--brand-teal)" }}>Avg {overallStar}%</span>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <StarCircle letter="S" pct={sStar} color="#3b82f6" />
                <StarCircle letter="T" pct={tStar} color="#0E7C86" />
                <StarCircle letter="A" pct={aStar} color="#F4BB42" />
                <StarCircle letter="R" pct={rStar} color="#22c55e" />
              </div>
            </div>

            {/* Key insights */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">Key insights</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                  {[strongest[1] >= 80, weakest[1] < 60, skipped.length > 0].filter(Boolean).length} takeaways
                </span>
              </div>
              <div className="space-y-3">
                {/* Strongest */}
                <div className="flex gap-3 rounded-xl bg-green-50 border border-green-100 p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-[10px] text-white font-bold">✓</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {strongest[0]} is your strongest part — {strongest[1]}%
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Keep anchoring your answers with a clear {strongest[0].toLowerCase()}.
                    </p>
                  </div>
                </div>
                {/* Weakest */}
                <div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[10px] text-white font-bold">!</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Focus next time — {weakest[0]} is still weak ({weakest[1]}%)
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {weakest[0] === "Result"
                        ? "Always close with a number — percentage, time saved, or user impact."
                        : weakest[0] === "Action"
                          ? 'Use "I" not "we". Be specific about what you personally did.'
                          : weakest[0] === "Situation"
                            ? "Set the scene briefly — 1–2 sentences max before moving on."
                            : "State your responsibility clearly before jumping into actions."}
                    </p>
                  </div>
                </div>
                {/* Skipped */}
                {skipped.length > 0 && (
                  <div className="flex gap-3 rounded-xl bg-red-50 border border-red-100 p-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-400 text-[10px] text-white font-bold">⊘</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {skipped.length} question{skipped.length !== 1 ? "s" : ""} skipped — come back to {skipped.length !== 1 ? "them" : "it"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        The skipped questions include {skipped.filter((q: PsQuestion) => q.starRecommended).length} gap-related ones. Most likely to come up in your {company ?? "upcoming"} interview.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Best + Worst answer ── */}
        {bestAnswer && worstAnswer && bestAnswer.id !== worstAnswer.id && (
          <div className="grid gap-4 sm:grid-cols-2">

            {/* Best */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">Your best answer</h2>
                <span className="text-sm font-extrabold text-green-600">{avgFeedback(bestAnswer.feedback!)}%</span>
              </div>
              <div className="rounded-xl border border-green-100 bg-green-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                    bestAnswer.question.type === "BEHAVIORAL" ? "bg-green-200 text-green-800" : "bg-purple-100 text-purple-700"
                  }`}>
                    {bestAnswer.question.type === "BEHAVIORAL" ? "Behavioural" : "Technical"}
                  </span>
                  <span className="text-[10px] text-slate-400">Q{bestAnswer.question.position}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800 leading-snug">&ldquo;{bestAnswer.question.text}&rdquo;</p>
                <p className="text-xs leading-relaxed text-slate-600 line-clamp-4 italic">&ldquo;{bestAnswer.text}&rdquo;</p>
                <p className="text-right text-sm font-extrabold text-green-600">{avgFeedback(bestAnswer.feedback!)}%</p>
              </div>
              {bestAnswer.feedback && (
                <div className="mt-3 rounded-xl border border-green-100 bg-green-50/50 px-3 py-2.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-green-600 mb-1">Why this worked</p>
                  <p className="text-xs leading-relaxed text-slate-600">{bestAnswer.feedback.relevanceWhy}</p>
                </div>
              )}
            </div>

            {/* Worst */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800">Needs most work</h2>
                <span className="text-sm font-extrabold text-red-500">{avgFeedback(worstAnswer.feedback!)}%</span>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                    worstAnswer.question.type === "BEHAVIORAL" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                  }`}>
                    {worstAnswer.question.type === "BEHAVIORAL" ? "Behavioural" : "Technical"}
                  </span>
                  <span className="text-[10px] text-slate-400">Q{worstAnswer.question.position}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800 leading-snug">&ldquo;{worstAnswer.question.text}&rdquo;</p>
                <p className="text-xs leading-relaxed text-slate-600 line-clamp-3 italic">&ldquo;{worstAnswer.text}&rdquo;</p>
                <p className="text-right text-sm font-extrabold text-red-500">{avgFeedback(worstAnswer.feedback!)}%</p>
              </div>
              {worstAnswer.feedback && (
                <div className="mt-3 rounded-xl border border-red-100 bg-red-50/50 px-3 py-2.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-red-500 mb-1">What to fix</p>
                  <p className="text-xs leading-relaxed text-slate-600">{worstAnswer.feedback.depthWhy}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Skipped questions ── */}
        {skipped.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Skipped questions — come back to these</h2>
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-600">
                {skipped.length} skipped
              </span>
            </div>
            <div className="space-y-2">
              {skipped.map((q: PsQuestion) => (
                <Link
                  key={q.id}
                  href={`/practice?session=${ps.id}&q=${q.id}`}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-teal-200 hover:bg-teal-50"
                >
                  <span className="shrink-0 text-xs font-bold text-slate-400 w-8 pt-0.5">Q{q.position}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                      q.type === "BEHAVIORAL" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {q.type === "BEHAVIORAL" ? "Behavioural" : "Technical"}
                    </span>
                    {q.starRecommended && (
                      <span className="rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[9px] font-extrabold text-red-600">
                        ▶ Gap
                      </span>
                    )}
                  </div>
                  <p className="flex-1 text-sm text-slate-700 leading-snug">&ldquo;{q.text}&rdquo;</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── What next? ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">What do you want to do next?</h2>
              <p className="mt-1 text-xs text-slate-500">
                Practice the skipped questions, re-analyse with an updated resume, or call it a day.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {firstSkippedId && (
                <Link
                  href={`/practice?session=${ps.id}&q=${firstSkippedId}`}
                  className="rounded-xl border px-4 py-2.5 text-sm font-bold transition hover:opacity-80"
                  style={{ borderColor: "var(--brand-teal)", color: "var(--brand-teal)", background: "#fff" }}
                >
                  Practice skipped →
                </Link>
              )}
              {ps.job?.id && (
                <Link
                  href={`/gap-analysis/edit?job=${ps.job.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition hover:opacity-80"
                  style={{ borderColor: "var(--brand-teal)", color: "var(--brand-teal)", background: "#fff" }}
                >
                  Re-analyse ↺
                </Link>
              )}
              <Link
                href="/"
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "var(--brand-teal)" }}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
