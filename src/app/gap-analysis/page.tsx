import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { GapAnalysisWaiting } from "./waiting";
import type { SkillGap, ResumeSuggestion } from "@/lib/ai/types";

type Props = { searchParams: Promise<{ job?: string }> };

// ── Data loader ───────────────────────────────────────────────────────────────

async function loadPageData(jobId: string, userId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId },
    include: {
      setupProfile: {
        include: { gapAnalysis: true },
      },
      practiceSessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          questions: {
            orderBy: { position: "asc" },
            select: { id: true, text: true, type: true, difficulty: true, starRecommended: true },
          },
        },
      },
    },
  });
  return job;
}

// ── Match score colour ────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return { text: "text-green-600",  bg: "bg-green-50",  ring: "#22c55e",  label: "Strong match" };
  if (score >= 65) return { text: "text-teal-600",   bg: "bg-teal-50",   ring: "#0E7C86",  label: "Good foundation" };
  if (score >= 45) return { text: "text-amber-600",  bg: "bg-amber-50",  ring: "#F4BB42",  label: "Some gaps" };
  return             { text: "text-red-500",          bg: "bg-red-50",    ring: "#ef4444",  label: "Large gap" };
}

// ── Circular score ring ───────────────────────────────────────────────────────

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const { ring, label } = scoreColor(score);
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 64 64" className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={ring} strokeWidth="5"
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-extrabold text-slate-800">
          {score}%
        </span>
      </div>
      <span className={`text-xs font-semibold ${scoreColor(score).text}`}>{label}</span>
    </div>
  );
}

// ── Gap severity badge ────────────────────────────────────────────────────────

function GapBadge({ importance }: { importance: string }) {
  if (importance === "critical")
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">Missing</span>;
  return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">Weak</span>;
}

function GapDot({ importance }: { importance: string }) {
  return (
    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${importance === "critical" ? "bg-red-500" : "bg-amber-400"}`} />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default async function GapAnalysisPage({ searchParams }: Props) {
  const params = await searchParams;
  if (!params.job) redirect("/");

  const session = await auth();
  if (!session?.user?.email) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!dbUser) redirect("/sign-in");

  const job = await loadPageData(params.job, dbUser.id);
  if (!job) redirect("/");

  const displayName =
    session.user.name?.split(" ").filter(Boolean).slice(0, 2)
      .map((p, i) => (i === 0 ? p : p[0] + ".")).join(" ") || "User";
  const initials =
    session.user.name?.split(" ").filter(Boolean).slice(0, 2)
      .map((p) => p[0]?.toUpperCase()).join("") || "U";

  async function handleSignOut() { "use server"; await signOut({ redirectTo: "/" }); }

  const ga = job.setupProfile?.gapAnalysis;
  const setup = job.setupProfile;
  const latestSession = job.practiceSessions[0];
  const questions = latestSession?.questions ?? [];

  // Parse job name: "Company - Role" or just role
  const nameParts = job.name.split(" - ");
  const companyName = nameParts.length > 1 ? nameParts[0] : null;
  const roleTitle = setup?.roleTitle || (nameParts.length > 1 ? nameParts.slice(1).join(" - ") : job.name);

  const skillGaps = (ga?.skillGaps as SkillGap[] | null) ?? [];
  const suggestions = (ga?.resumeSuggestions as ResumeSuggestion[] | null) ?? [];
  const rewrites = suggestions.filter((s) => s.type === "rewrite" && s.original);

  const behavioralCount = questions.filter((q) => q.type === "BEHAVIORAL").length;
  const technicalCount  = questions.filter((q) => q.type === "TECHNICAL").length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4F8" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-cyan-900/40 bg-[#071f3f]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-700 text-cyan-100 text-sm">◉</div>
            <span className="text-xl font-bold tracking-tight text-white">
              Prep<span className="text-cyan-400">AI</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
            <span className="font-medium text-slate-200">Gap analysis</span>
            <span>·</span>
            <span>Step 2 of 2</span>
            <div className="ml-2 flex gap-1">
              <span className="h-1.5 w-6 rounded-full bg-slate-600" />
              <span className="h-1.5 w-6 rounded-full bg-cyan-500" />
            </div>
          </div>
          <ProfileDropdown displayName={displayName} initials={initials} signOutAction={handleSignOut} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-8">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-slate-700 mb-6">
          ← Back to dashboard
        </Link>

        {/* ── If gap analysis not ready yet, show waiting state ── */}
        {!ga ? (
          <GapAnalysisWaiting />
        ) : (
          <div className="space-y-6">

            {/* ── Hero card ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-600">Analysis complete</p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{roleTitle}</h1>
              {companyName && (
                <p className="mt-0.5 text-sm text-slate-500">
                  {companyName} · Added {new Date(job.createdAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                </p>
              )}

              {/* Stats row */}
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {/* Match score */}
                <div className={`rounded-2xl ${scoreColor(ga.matchScore).bg} p-4 flex flex-col items-center gap-2`}>
                  <ScoreRing score={ga.matchScore} size={72} />
                  <p className="text-xs font-semibold text-slate-600 text-center">Match score</p>
                </div>

                {/* Skills matched */}
                <div className="rounded-2xl bg-slate-50 p-4 flex flex-col items-center justify-center gap-1 text-center">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-800">
                      {(ga.strengthAreas?.length ?? 0) + skillGaps.filter(g => g.importance !== "critical").length}
                    </span>
                    <span className="text-lg text-slate-400">/{(ga.strengthAreas?.length ?? 0) + skillGaps.length}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <span className="text-teal-500">✓</span> Skills matched
                  </p>
                  <p className="text-[11px] text-slate-400">{skillGaps.length} gap{skillGaps.length !== 1 ? "s" : ""} to address</p>
                </div>

                {/* Gaps to cover */}
                <div className="rounded-2xl bg-slate-50 p-4 flex flex-col items-center justify-center gap-1 text-center">
                  <span className="text-3xl font-extrabold text-red-500">{skillGaps.length}</span>
                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <span className="text-red-400">⚑</span> Gaps to cover
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {skillGaps.filter(g => g.importance === "critical").length} critical
                    {skillGaps.filter(g => g.importance !== "critical").length > 0
                      ? ` · ${skillGaps.filter(g => g.importance !== "critical").length} more`
                      : ""}
                  </p>
                </div>

                {/* Questions ready */}
                <div className="rounded-2xl bg-slate-50 p-4 flex flex-col items-center justify-center gap-1 text-center">
                  <span className="text-3xl font-extrabold text-amber-500">{questions.length || "—"}</span>
                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <span className="text-amber-400">◎</span> Questions ready
                  </p>
                  {questions.length > 0 && (
                    <p className="text-[11px] text-slate-400">
                      {behavioralCount} behavioural · {technicalCount} technical
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Middle two columns ── */}
            <div className="grid gap-5 lg:grid-cols-2">

              {/* Skill gaps */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800">Skill gaps to cover</h2>
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-500 border border-red-100">
                    {skillGaps.length} gap{skillGaps.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-4">
                  {skillGaps.length === 0 ? (
                    <p className="text-sm text-slate-400">No critical gaps found — great shape!</p>
                  ) : (
                    skillGaps.map((gap, i) => (
                      <div key={i} className="flex gap-3">
                        <GapDot importance={gap.importance} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-slate-800">{gap.skill}</span>
                            <GapBadge importance={gap.importance} />
                          </div>
                          <p className="text-xs leading-relaxed text-slate-500">{gap.context}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Resume rewrites */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800">Resume bullets to rewrite</h2>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-600 border border-amber-100">
                    {rewrites.length} suggestion{rewrites.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-5">
                  {rewrites.length === 0 ? (
                    <p className="text-sm text-slate-400">No rewrite suggestions — your bullets look solid.</p>
                  ) : (
                    rewrites.slice(0, 3).map((s, i) => (
                      <div key={i} className="space-y-2">
                        {s.original && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Current wording</p>
                            <p className="text-xs text-slate-600 italic">&ldquo;{s.original}&rdquo;</p>
                          </div>
                        )}
                        <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5">
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-teal-600">
                            ✦ Suggested rewrite
                          </p>
                          <p className="text-xs text-teal-800">&ldquo;{s.suggestion}&rdquo;</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── Interview questions ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-slate-800">Interview questions</h2>
                  {questions.length > 0 && (
                    <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700 border border-teal-200">
                      {questions.length} ready
                    </span>
                  )}
                </div>
                {questions.length > 0 && (
                  <div className="flex gap-2 text-xs">
                    {behavioralCount > 0 && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700 border border-blue-100">
                        Behavioural · {behavioralCount}
                      </span>
                    )}
                    {technicalCount > 0 && (
                      <span className="rounded-full bg-purple-50 px-2.5 py-1 font-medium text-purple-700 border border-purple-100">
                        Technical · {technicalCount}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {questions.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  <span className="animate-spin text-teal-400">◎</span>
                  Generating your personalised questions… refresh in a moment.
                </div>
              ) : (
                <div className="space-y-2">
                  {questions.slice(0, 5).map((q, i) => (
                    <div key={q.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <span className="mt-0.5 shrink-0 text-xs text-slate-400 w-4">{i + 1}.</span>
                      <p className="flex-1 text-sm text-slate-700">{q.text}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        q.type === "BEHAVIORAL"
                          ? "bg-blue-50 text-blue-600 border border-blue-100"
                          : "bg-purple-50 text-purple-600 border border-purple-100"
                      }`}>
                        {q.type === "BEHAVIORAL" ? "Behavioural" : "Technical"}
                      </span>
                    </div>
                  ))}

                  {questions.length > 5 && (
                    <p className="pt-1 text-center text-xs text-slate-400">
                      + {questions.length - 5} more questions
                    </p>
                  )}
                </div>
              )}

              {/* CTA */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                <p className="text-sm text-slate-500">
                  {questions.length > 0
                    ? `View all ${questions.length} questions — start practising`
                    : "Questions ready once generation completes"}
                </p>
                {latestSession && (
                  <Link
                    href={`/practice?session=${latestSession.id}`}
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
                    style={{ background: "var(--brand-teal)" }}
                  >
                    Start practising →
                  </Link>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
