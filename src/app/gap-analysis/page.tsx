import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Logo } from "@/components/logo";
import { GapAnalysisWaiting } from "./waiting";
import { GapAnalysisTabs } from "./tabs";
import type { SkillGap, ResumeSuggestion } from "@/lib/ai/types";

type Props = { searchParams: Promise<{ job?: string }> };

// ── Data loader ───────────────────────────────────────────────────────────────

async function loadPageData(jobId: string, userId: string) {
  return prisma.job.findFirst({
    where: { id: jobId, userId },
    include: {
      setupProfile: { include: { gapAnalysis: true } },
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
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return { text: "text-green-600",  ring: "#22c55e",  bar: "bg-green-500",  label: "Strong match" };
  if (score >= 65) return { text: "text-teal-600",   ring: "#0E7C86",  bar: "bg-teal-500",   label: "Good foundation" };
  if (score >= 45) return { text: "text-amber-600",  ring: "#F4BB42",  bar: "bg-amber-400",  label: "Some gaps" };
  return             { text: "text-red-500",          ring: "#ef4444",  bar: "bg-red-500",    label: "Large gap" };
}

function ScoreRing({ score }: { score: number }) {
  const { ring, label, text } = scoreColor(score);
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={ring} strokeWidth="5"
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-base font-extrabold text-slate-800">
          {score}%
        </span>
      </div>
      <span className={`text-xs font-semibold ${text}`}>{label}</span>
    </div>
  );
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60)  return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)} mins ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} hrs ago`;
  return `${Math.floor(secs / 86400)} days ago`;
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, icon, big, sub, underlineColor,
}: {
  label: string;
  icon: React.ReactNode;
  big: React.ReactNode;
  sub: string;
  underlineColor: string;
}) {
  return (
    <div className="relative flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{label}</span>
        <span className="text-slate-300">{icon}</span>
      </div>
      <div className="text-2xl font-extrabold text-slate-800 leading-none">{big}</div>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      {/* Coloured underline */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${underlineColor}`} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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

  const ga            = job.setupProfile?.gapAnalysis;
  const setup         = job.setupProfile;
  const latestSession = job.practiceSessions[0];
  const questions     = latestSession?.questions ?? [];

  // Parse job name
  const nameParts  = job.name.split(" - ");
  const companyName = nameParts.length > 1 ? nameParts[0] : null;
  const roleTitle  = setup?.roleTitle || (nameParts.length > 1 ? nameParts.slice(1).join(" - ") : job.name);

  const skillGaps   = (ga?.skillGaps   as SkillGap[]        | null) ?? [];
  const suggestions = (ga?.resumeSuggestions as ResumeSuggestion[] | null) ?? [];
  // rewrites derived inside GapAnalysisTabs — not needed at page level

  const criticalCount  = skillGaps.filter((g) => g.importance === "critical").length;
  const minorCount     = skillGaps.filter((g) => g.importance !== "critical").length;
  const strengthCount  = ga?.strengthAreas?.length ?? 0;
  const totalSkills    = strengthCount + skillGaps.length;
  const matchedSkills  = strengthCount + minorCount;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4F8" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-cyan-900/40 bg-[#071f3f]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
          <Logo />
          <ProfileDropdown displayName={displayName} initials={initials} signOutAction={handleSignOut} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-6">

        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-slate-700 mb-5">
          ← Back to dashboard
        </Link>

        {!ga ? (
          <GapAnalysisWaiting />
        ) : (
          <div className="space-y-5">

            {/* ── Hero card ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                {/* Left: title block */}
                <div className="min-w-0">
                  <p className="mb-1 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-teal-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                    Analysis complete · {timeAgo(new Date(ga.createdAt))}
                  </p>
                  <h1 className="truncate text-2xl font-extrabold tracking-tight text-slate-900">{roleTitle}</h1>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {companyName && <>{companyName} · </>}
                    Posted {timeAgo(new Date(job.createdAt))}
                  </p>
                </div>
                {/* Right: action buttons */}
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/gap-analysis/edit?job=${job.id}`}
                    className="hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white hover:border-slate-300 sm:block"
                  >
                    Edit prep
                  </Link>
                  {latestSession && (
                    <Link
                      href={`/practice?session=${latestSession.id}`}
                      className="rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
                      style={{ background: "var(--brand-teal)" }}
                    >
                      Start practising →
                    </Link>
                  )}
                </div>
              </div>

              {/* ── 4 stat cards ── */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  label="Match score"
                  icon={<span className="text-base">◎</span>}
                  big={<ScoreRing score={ga.matchScore} />}
                  sub=""
                  underlineColor={scoreColor(ga.matchScore).bar}
                />
                <StatCard
                  label="Skills matched"
                  icon={<span className="text-green-400 text-base">✓</span>}
                  big={
                    <span>
                      {matchedSkills}
                      <span className="text-base font-semibold text-slate-400"> / {totalSkills}</span>
                    </span>
                  }
                  sub={`${skillGaps.length} gap${skillGaps.length !== 1 ? "s" : ""} remaining`}
                  underlineColor="bg-green-400"
                />
                <StatCard
                  label="Gaps to cover"
                  icon={<span className="text-red-400 text-base">⚑</span>}
                  big={<span className="text-red-500">{skillGaps.length}</span>}
                  sub={`${criticalCount} critical · ${minorCount} minor`}
                  underlineColor="bg-gradient-to-r from-red-500 to-orange-400"
                />
                <StatCard
                  label="Questions ready"
                  icon={<span className="text-amber-400 text-base">◈</span>}
                  big={<span className="text-amber-500">{questions.length || "—"}</span>}
                  sub={questions.length > 0 ? "Across categories" : "Generating…"}
                  underlineColor="bg-gradient-to-r from-amber-400 to-yellow-300"
                />
              </div>
            </div>

            {/* ── 3-tab section ── */}
            <GapAnalysisTabs
              skillGaps={skillGaps}
              suggestions={suggestions}
              questions={questions}
              sessionId={latestSession?.id ?? null}
            />

          </div>
        )}
      </main>
    </div>
  );
}
