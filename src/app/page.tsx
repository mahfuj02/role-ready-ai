import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { getUserJobs, getDashboardStats, setCurrentJob, type JobWithStats, type SkillTag } from "@/lib/jobs/actions";
import { redirect } from "next/navigation";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Logo } from "@/components/logo";
import { DeleteJobButton } from "@/components/delete-job-button";
import { OnboardingCard } from "@/components/onboarding-card";

// ── Circular progress donut ────────────────────────────────────────────────────

function CircularProgress({ pct, color }: { pct: number; color: string }) {
  const r = 15.9155;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="relative text-xs font-bold" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ── Skill tag pill ─────────────────────────────────────────────────────────────

const TAG_STYLES: Record<SkillTag["variant"], string> = {
  missing: "bg-red-50 text-red-600",
  weak:    "bg-amber-50 text-amber-700",
  strong:  "bg-green-50 text-green-700",
};

function SkillTagPill({ tag }: { tag: SkillTag }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TAG_STYLES[tag.variant]}`}>
      {tag.label}
    </span>
  );
}

// ── Time ago helper ───────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60)   return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ── Card accent colours — teal = complete, amber = in-progress / new ──────────

const ACCENT_COMPLETE  = { border: "#0E7C86", avatar: "#07505a", btn: "#0E7C86", ring: "#0E7C86" };
const ACCENT_INPROGRESS = { border: "#F4BB42", avatar: "#7a5a00", btn: "#d49f1a", ring: "#F4BB42" };

function jobAccent(job: JobWithStats) {
  const pct =
    job.totalQuestionsAvailable > 0
      ? Math.round((job.totalQuestionsAttempted / job.totalQuestionsAvailable) * 100)
      : 0;
  return pct === 100 ? ACCENT_COMPLETE : ACCENT_INPROGRESS;
}

// ── Home (logged-in) ──────────────────────────────────────────────────────────

export default async function Home() {
  const session = await auth();

  if (!session?.user?.email) {
    return <LandingPage />;
  }

  const [jobs, stats] = await Promise.all([getUserJobs(), getDashboardStats()]);
  const firstName = session.user.name?.split(" ")[0] || "there";
  const displayName =
    session.user.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p, i) => (i === 0 ? p : p[0] + "."))
      .join(" ") || "User";
  const initials =
    session.user.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

  const activeCount = jobs.filter((j) => j.status !== "new").length;

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f1f4f8" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-cyan-900/40 bg-[#071f3f]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3.5">
          {/* Logo */}
          <Logo />

          {/* Profile */}
          <ProfileDropdown
            displayName={displayName}
            initials={initials}
            signOutAction={handleSignOut}
          />
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden border-b border-cyan-900/30 px-6 py-12"
        style={{
          backgroundColor: "#072548",
          backgroundImage:
            "linear-gradient(to right, rgba(19,78,132,.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(19,78,132,.35) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8">
          {/* Left copy */}
          <div>
            {/* Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-700/30 px-3 py-1 text-xs font-medium text-cyan-300 border border-cyan-700/40">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              {activeCount} active prep{activeCount !== 1 ? "s" : ""}
            </div>

            {jobs.length === 0 ? (
              <>
                <h1 className="text-3xl font-extrabold leading-snug tracking-tight text-white sm:text-4xl">
                  Welcome to{" "}
                  <span className="text-cyan-400">RoleReady</span>,<br />{firstName}!
                </h1>
                <p className="mt-3 text-sm text-slate-400">
                  Start your first prep session to get interview-ready.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-extrabold leading-snug tracking-tight text-white sm:text-4xl">
                  Ready to{" "}
                  <span className="text-cyan-400">practice</span>{" "}
                  today,<br />{firstName}?
                </h1>
                <p className="mt-3 text-sm text-slate-400">
                  Pick up where you left off or start a new prep below.
                </p>
                {stats.lastSession && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    Last session: {stats.lastSession.label} · {timeAgo(stats.lastSession.createdAt)}
                  </div>
                )}
              </>
            )}
          </div>

          {/* New prep session CTA */}
          <Link
            href="/jobs/new"
            className="animate-prep-glow flex-shrink-0 flex items-center gap-4 rounded-2xl border border-cyan-700/50 bg-[#09324f] px-6 py-4 text-white shadow-lg transition hover:border-cyan-500/60 hover:bg-[#0a3a5c]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-700/40 text-cyan-300 text-xl">
              ✦
            </span>
            <span>
              <div className="font-bold text-white">New prep session</div>
              <div className="text-xs text-slate-400 mt-0.5">Upload resume + job description</div>
            </span>
          </Link>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#09324f] border border-cyan-800/50 text-slate-400 text-sm">
            ↓
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <main className="mx-auto w-full max-w-6xl px-6 py-10">

        {/* ── Stats row — returning users only ── */}
        {jobs.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Active preps */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Active preps</p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900">{jobs.length}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {jobs.filter(j => j.status === "active").length} in progress
              </p>
              <div className="mt-2 h-0.5 w-8 rounded-full" style={{ background: "var(--brand-teal)" }} />
            </div>

            {/* Questions answered */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Questions answered</p>
              <p className="mt-1 text-3xl font-extrabold text-slate-900">{stats.questionsThisWeek}</p>
              <p className="mt-0.5 text-xs text-slate-400">this week</p>
              <div className="mt-2 h-0.5 w-8 rounded-full bg-blue-400" />
            </div>

            {/* Avg score */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Avg score</p>
              <p className={`mt-1 text-3xl font-extrabold ${stats.avgScorePct !== null ? (stats.avgScorePct >= 70 ? "text-teal-600" : stats.avgScorePct >= 50 ? "text-amber-500" : "text-red-500") : "text-slate-300"}`}>
                {stats.avgScorePct !== null ? `${stats.avgScorePct}%` : "—"}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">across all answers</p>
              <div className="mt-2 h-0.5 w-8 rounded-full bg-amber-400" />
            </div>

            {/* Weakest area */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Weakest area</p>
              <p className={`mt-1 text-2xl font-extrabold ${stats.weakestArea ? "text-red-500" : "text-slate-300"}`}>
                {stats.weakestArea?.label ?? "—"}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {stats.weakestArea ? `Avg ${stats.weakestArea.pct}% — needs work` : "No data yet"}
              </p>
              <div className="mt-2 h-0.5 w-8 rounded-full bg-red-400" />
            </div>
          </div>
        )}

        {/* ── Today's Focus — only when there's an in-progress session ── */}
        {stats.inProgress && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base" style={{ background: "var(--brand-teal)", color: "#fff" }}>
                ✦
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600 mb-0.5">Today&apos;s focus</p>
                <p className="text-sm font-semibold text-slate-800 truncate">
                  Session in progress —{" "}
                  {stats.inProgress.company ? `${stats.inProgress.company} · ` : ""}
                  {stats.inProgress.role}. You&apos;re on Q{stats.inProgress.answered + 1} of {stats.inProgress.total}. Keep going!
                </p>
              </div>
            </div>
            <Link
              href={`/practice?session=${stats.inProgress.sessionId}`}
              className="shrink-0 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-bold text-teal-700 transition hover:bg-teal-100 whitespace-nowrap"
            >
              Continue →
            </Link>
          </div>
        )}

        {/* Section header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-700">Your interview preps</h2>
          {activeCount > 0 && (
            <span className="rounded-full border border-slate-300 bg-white px-3 py-0.5 text-xs font-medium text-slate-600">
              {activeCount} active
            </span>
          )}
        </div>

        {/* Onboarding card — client component, self-dismisses via localStorage */}
        {jobs.length === 0 && <OnboardingCard />}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} accent={jobAccent(job)} />
          ))}

          {/* New prep session card — always last */}
          <Link
            href="/jobs/new"
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-12 text-center transition hover:border-teal-400 hover:bg-teal-50/40 hover:shadow-sm"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400 text-xl transition group-hover:border-teal-400 group-hover:text-teal-500">
              +
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-600 group-hover:text-teal-700">New prep session</p>
              <p className="mt-0.5 text-xs text-slate-400">Upload resume + job description</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

// ── Job Card ───────────────────────────────────────────────────────────────────

function JobCard({
  job,
  accent,
}: {
  job: JobWithStats;
  accent: { border: string; avatar: string; btn: string; ring: string };
}) {
  async function handleSelect() {
    "use server";
    await setCurrentJob(job.id);
    redirect("/practice");
  }

  const completionPct =
    job.totalQuestionsAvailable > 0
      ? Math.round((job.totalQuestionsAttempted / job.totalQuestionsAvailable) * 100)
      : 0;

  const initial = (job.companyName || job.roleTitle || "?")[0].toUpperCase();

  const STATUS_LABEL: Record<JobWithStats["status"], string> = {
    active:        "Active",
    just_started:  "Just started",
    new:           "New",
  };
  const STATUS_STYLE: Record<JobWithStats["status"], string> = {
    active:       "bg-cyan-50 text-cyan-700 border border-cyan-200",
    just_started: "bg-amber-50 text-amber-700 border border-amber-200",
    new:          "bg-slate-100 text-slate-500 border border-slate-200",
  };

  return (
    <article
      className="flex flex-col rounded-2xl bg-white shadow-sm overflow-hidden"
      style={{ borderTop: `3px solid ${accent.border}` }}
    >
      {/* Card header */}
      <div className="flex items-start justify-between p-5 pb-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: accent.avatar }}
          >
            {initial}
          </span>
          <div>
            {job.companyName && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {job.companyName}
              </p>
            )}
            <h3 className="text-[15px] font-bold leading-tight text-slate-900">
              {job.roleTitle}
            </h3>
          </div>
        </div>
        {/* Status badge + delete */}
        <div className="flex items-center gap-1.5">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[job.status]}`}>
            {STATUS_LABEL[job.status]}
          </span>
          <DeleteJobButton jobId={job.id} jobName={job.name} />
        </div>
      </div>

      {/* Skill tags */}
      {job.skillTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-3">
          {job.skillTags.map((t) => (
            <SkillTagPill key={t.label} tag={t} />
          ))}
        </div>
      )}

      {/* Progress row */}
      <div className="flex items-center gap-4 px-5 pb-4">
        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-baseline justify-between text-xs text-slate-500">
            <span>
              {job.totalQuestionsAttempted} / {job.totalQuestionsAvailable || "—"} questions
              {job.sessionCount > 1 && (
                <span className="ml-1 text-slate-400">· session {job.sessionCount}</span>
              )}
            </span>
            <span className="font-semibold text-slate-700">{completionPct}%</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${completionPct}%`, backgroundColor: accent.border }}
            />
          </div>
        </div>

        {/* Practice score ring with match score tooltip */}
        <div className="group relative flex-shrink-0">
          {job.sessionScore !== undefined ? (
            <CircularProgress pct={job.sessionScore} color={accent.ring} />
          ) : (
            <div className="h-14 w-14 flex items-center justify-center rounded-full bg-slate-50 border-2 border-dashed border-slate-200">
              <span className="text-[10px] text-slate-400 text-center leading-tight">No<br/>score</span>
            </div>
          )}
          {/* Tooltip: match score */}
          {job.matchScore !== undefined && (
            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-20">
              <div className="whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg">
                Match {job.matchScore}%
              </div>
              <div className="mx-auto mt-0.5 h-1.5 w-1.5 rotate-45 bg-slate-800" />
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-auto flex gap-2 px-4 pb-4">
        {/* Analysis — outline, same colour reversed */}
        <Link
          href={`/gap-analysis/edit?job=${job.id}`}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border py-2.5 text-sm font-bold transition hover:opacity-80 active:scale-[0.98]"
          style={{ borderColor: accent.btn, color: accent.btn, background: "#fff" }}
        >
          Analysis
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="8" x2="13" y2="8" /><polyline points="9 4 13 8 9 12" />
          </svg>
        </Link>
        {/* Practice — filled */}
        <form action={handleSelect} className="flex-1">
          <button
            type="submit"
            className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: accent.btn }}
          >
            {job.status === "active" ? "Continue →" : "Practice →"}
          </button>
        </form>
      </div>
    </article>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────

async function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--brand-navy)", color: "#fff" }}>

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-md" style={{ background: "rgba(11,31,58,0.85)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight text-cyan-400">RoleReady</span>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" }, { prompt: "select_account" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-white/40 hover:bg-white/5"
            >
              Sign in →
            </button>
          </form>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-28 text-center">
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
          style={{ width: 600, height: 600, background: "radial-gradient(circle, #0E7C86 0%, transparent 70%)" }}
        />

        <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm backdrop-blur">
          <span className="animate-pulse-glow h-2 w-2 rounded-full" style={{ background: "var(--brand-teal)" }} />
          <span className="text-white/70">AI-Powered Interview Coach</span>
        </div>

        <h1
          className="animate-fade-up max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl"
          style={{ animationDelay: "0.1s" }}
        >
          Land the job{" "}
          <span style={{ color: "var(--brand-teal)" }}>you actually want.</span>
        </h1>

        <p
          className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-white/60"
          style={{ animationDelay: "0.2s" }}
        >
          Upload your resume and job description. RoleReady spots every gap,
          generates role-specific questions, and coaches your answers with
          real-time STAR feedback.
        </p>

        <div
          className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-4"
          style={{ animationDelay: "0.3s" }}
        >
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" }, { prompt: "select_account" });
            }}
          >
            <button
              type="submit"
              className="rounded-xl px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:opacity-90"
              style={{ background: "var(--brand-teal)" }}
            >
              Get started free →
            </button>
          </form>
          <a
            href="#how-it-works"
            className="rounded-xl border border-white/20 px-7 py-3.5 text-base font-medium text-white/80 transition hover:border-white/40 hover:bg-white/5"
          >
            See how it works ↓
          </a>
        </div>
        <p className="animate-fade-up mt-8 text-sm text-white/30" style={{ animationDelay: "0.4s" }}>
          Free to start · No credit card required
        </p>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-center text-sm font-medium uppercase tracking-widest" style={{ color: "var(--brand-teal)" }}>
            How it works
          </p>
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Four steps from upload to offer.
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Upload Resume & JD",    desc: "Paste or upload your resume and the job description for any role you're targeting.", color: "var(--brand-teal)" },
              { step: "02", title: "Gap Analysis",          desc: "AI maps your resume against the JD — showing match score, missing skills, and resume rewrites.", color: "var(--brand-amber)" },
              { step: "03", title: "Practice Questions",    desc: "10 role-specific questions generated from your actual experience and the JD.", color: "var(--brand-teal)" },
              { step: "04", title: "STAR Feedback",         desc: "Answer by typing or speaking. Get scored on relevance, clarity, depth, and STAR structure.", color: "var(--brand-amber)" },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div
                  className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold"
                  style={{ background: `${color}18`, border: `1.5px solid ${color}40`, color }}
                >
                  {step}
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-sm text-white/25">
        © {new Date().getFullYear()} RoleReady · AI-powered interview coaching
      </footer>
    </div>
  );
}
