import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import { getUserJobs, setCurrentJob } from "@/lib/jobs/actions";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-slate-100">
        <main className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
          <p className="text-sm tracking-[0.2em] text-teal-300">ROLEREADY</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Practice real interviews with AI coaching that tracks progress.
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300">
            RoleReady generates role-specific questions from your resume and job description,
            scores each answer, and improves your STAR habits over time.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/jobs" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg bg-teal-400 px-5 py-2.5 font-medium text-slate-950 transition hover:bg-teal-300"
              >
                Sign in with Google
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const jobs = await getUserJobs();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      {/* Header with User Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome, {session.user.name || "there"}!</h1>
          <p className="mt-1 text-slate-600">Manage your job interview preparations</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* Create New Job Section */}
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Job Preparations</h2>
        <p className="text-sm text-slate-600">
          Create new job preparations or select an existing one to continue practicing.
        </p>

        <Link
          href="/jobs/new"
          className="mt-2 inline-flex w-fit items-center justify-center rounded-lg bg-teal-400 px-6 py-3 font-medium text-slate-950 transition hover:bg-teal-300"
        >
          + Create New Job Preparation
        </Link>
      </section>

      {/* Jobs Grid */}
      <section>
        {jobs.length === 0 ? (
          <div className="rounded border border-dashed border-slate-300 p-8 text-center">
            <p className="text-slate-600">
              No job preparations yet. Create one to get started!
            </p>
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
    <form action={handleSelectJob}>
      <button
        type="submit"
        className="w-full rounded-lg border border-slate-200 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">{job.name}</h3>
            {job.setupProfile && (
              <p className="mt-1 text-sm text-slate-600">
                {job.setupProfile.roleTitle} • {job.setupProfile.seniority}
              </p>
            )}
            {job.description && (
              <p className="mt-2 text-sm text-slate-600">{job.description}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
          <div>
            <div className="text-slate-900 font-semibold">{job.sessionCount}</div>
            <div>Sessions</div>
          </div>
          <div>
            <div className="text-slate-900 font-semibold">{job.totalQuestionsAttempted}</div>
            <div>Questions</div>
          </div>
          {job.lastPracticedAt && (
            <div>
              <div className="text-slate-900 font-semibold">
                {job.lastPracticedAt.toLocaleDateString()}
              </div>
              <div>Last Practice</div>
            </div>
          )}
        </div>
      </button>
    </form>
  );
}
