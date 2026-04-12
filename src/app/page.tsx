import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { getUserJobs, setCurrentJob } from "@/lib/jobs/actions";
import { redirect } from "next/navigation";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
}

export default async function Home() {
  const session = await auth();

  if (!session?.user?.email) {
    return <LandingPage />;
  }

  const jobs = await getUserJobs();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome, {session.user.name?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-1 text-slate-500">Your interview preparations</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* New Prep */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Job Preparations</h2>
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
            style={{ background: "var(--brand-teal)" }}
          >
            <span className="text-base leading-none">+</span> New prep
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
            <p className="text-slate-500">No preparations yet.</p>
            <Link
              href="/jobs/new"
              className="mt-4 inline-flex items-center gap-1 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              style={{ background: "var(--brand-teal)" }}
            >
              Create your first prep
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────────────

function JobCard({
  job,
}: {
  job: {
    id: string;
    name: string;
    description?: string;
    setupProfile?: { roleTitle: string; seniority: string };
    sessionCount: number;
    totalQuestionsAttempted: number;
    lastOpenedAt: Date;
    lastPracticedAt?: Date;
    createdAt: Date;
  };
}) {
  async function handleSelectJob() {
    "use server";
    await setCurrentJob(job.id);
    redirect("/practice");
  }

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <form action={handleSelectJob} className="flex-1">
        <button type="submit" className="w-full text-left">
          <h3 className="font-semibold text-slate-900">{job.name}</h3>
          {job.setupProfile && (
            <p className="mt-0.5 text-sm text-slate-500">
              {job.setupProfile.roleTitle} · {job.setupProfile.seniority}
            </p>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-slate-50 py-2">
              <div className="text-lg font-bold text-slate-900">{job.sessionCount}</div>
              <div className="text-xs text-slate-500">Sessions</div>
            </div>
            <div className="rounded-lg bg-slate-50 py-2">
              <div className="text-lg font-bold text-slate-900">{job.totalQuestionsAttempted}</div>
              <div className="text-xs text-slate-500">Answers</div>
            </div>
            <div className="rounded-lg bg-slate-50 py-2">
              <div className="text-xs font-semibold text-slate-900">
                {job.lastPracticedAt ? formatDate(job.lastPracticedAt) : "—"}
              </div>
              <div className="text-xs text-slate-500">Last practice</div>
            </div>
          </div>
        </button>
      </form>

      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
        <Link
          href="/dashboard"
          className="flex-1 rounded-lg border border-slate-200 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Dashboard
        </Link>
        <Link
          href="/feedback"
          className="flex-1 rounded-lg py-2 text-center text-sm font-medium text-white transition hover:opacity-90"
          style={{ background: "var(--brand-teal)" }}
        >
          Feedback
        </Link>
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
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--brand-teal)" }}>
            RoleReady
          </span>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
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
        {/* Background glow blobs */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
          style={{ width: 600, height: 600, background: "radial-gradient(circle, #0E7C86 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute right-0 top-0 rounded-full opacity-10 blur-3xl"
          style={{ width: 400, height: 400, background: "radial-gradient(circle, #F4BB42 0%, transparent 70%)" }}
        />

        {/* Badge */}
        <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm backdrop-blur">
          <span className="animate-pulse-glow h-2 w-2 rounded-full" style={{ background: "var(--brand-teal)" }} />
          <span className="text-white/70">AI-Powered Interview Coach</span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-up max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl"
          style={{ animationDelay: "0.1s" }}
        >
          Land the job{" "}
          <span style={{ color: "var(--brand-teal)" }}>you actually want.</span>
        </h1>

        {/* Subtext */}
        <p
          className="animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-white/60"
          style={{ animationDelay: "0.2s" }}
        >
          Upload your resume and job description. RoleReady spots every gap,
          generates role-specific questions, and coaches your answers with
          real-time STAR feedback.
        </p>

        {/* CTAs */}
        <div
          className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-4"
          style={{ animationDelay: "0.3s" }}
        >
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-xl px-7 py-3.5 text-base font-semibold text-slate-950 shadow-lg transition hover:opacity-90 hover:shadow-xl"
              style={{ background: "var(--brand-teal)", color: "#fff" }}
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

        {/* Social proof */}
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

          <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Connector line (desktop) */}
            <div
              className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px lg:block"
              style={{ background: "linear-gradient(90deg, transparent, rgba(14,124,134,0.4), transparent)" }}
            />

            {[
              {
                step: "01",
                title: "Upload Resume & JD",
                desc: "Paste or upload your resume and the job description for any role you're targeting.",
                color: "var(--brand-teal)",
              },
              {
                step: "02",
                title: "Gap Analysis",
                desc: "AI maps your resume against the JD — showing match score, missing skills, and resume rewrites.",
                color: "var(--brand-amber)",
              },
              {
                step: "03",
                title: "Practice Questions",
                desc: "10 role-specific questions generated from your actual experience and the JD.",
                color: "var(--brand-teal)",
              },
              {
                step: "04",
                title: "STAR Feedback",
                desc: "Answer by typing or speaking. Get scored on relevance, clarity, depth, and STAR structure.",
                color: "var(--brand-amber)",
              },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                <div
                  className="z-10 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold"
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

      {/* ── Feature highlights ── */}
      <section className="border-t border-white/5 px-6 py-24" style={{ background: "var(--brand-charcoal)" }}>
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-center text-sm font-medium uppercase tracking-widest" style={{ color: "var(--brand-amber)" }}>
            What you get
          </p>
          <h2 className="mb-16 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Built for serious candidates.
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "◎",
                title: "Match Score",
                desc: "See exactly how well your resume matches the role — down to missing keywords and impact gaps.",
                accent: "var(--brand-teal)",
              },
              {
                icon: "✦",
                title: "Smart Questions",
                desc: "Questions tailored to your specific background and the JD, not generic prep lists.",
                accent: "var(--brand-amber)",
              },
              {
                icon: "◈",
                title: "STAR Coaching",
                desc: "Real-time feedback on Situation, Task, Action, Result — with evidence and a personalized coach tip.",
                accent: "var(--brand-teal)",
              },
              {
                icon: "▲",
                title: "Resume Rewrites",
                desc: "Concrete bullet rewrites and additions that close the gap between your resume and the role.",
                accent: "var(--brand-amber)",
              },
              {
                icon: "◉",
                title: "Multiple Preps",
                desc: "Run separate preparations for every role you're targeting — all tracked independently.",
                accent: "var(--brand-teal)",
              },
              {
                icon: "◐",
                title: "Progress Tracking",
                desc: "Session history, score trends, and STAR completion rates — so you can see yourself improve.",
                accent: "var(--brand-amber)",
              },
            ].map(({ icon, title, desc, accent }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/5 p-6 transition hover:border-white/10 hover:bg-white/5"
              >
                <div className="mb-4 text-2xl" style={{ color: accent }}>
                  {icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t border-white/5 px-6 py-28 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to close the gap?
          </h2>
          <p className="mt-4 text-lg text-white/50">
            Free to start. No credit card. Your first prep in under 5 minutes.
          </p>
          <form
            className="mt-10"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-xl px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:opacity-90 hover:shadow-xl"
              style={{ background: "var(--brand-teal)" }}
            >
              Start your first prep →
            </button>
          </form>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-sm text-white/25">
        © {new Date().getFullYear()} RoleReady · Built with AI coaching
      </footer>

    </div>
  );
}
