import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { generatePracticeSession, saveSetupProfile } from "./actions";

type SetupPageProps = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function SetupPage({ searchParams }: SetupPageProps) {
  const user = await requireUser();
  const params = await searchParams;

  let latestProfile: {
    roleTitle: string;
    seniority: string;
    resumeText: string;
    jobDescriptionText: string;
  } | null = null;

  if (user.email) {
    const existing = await prisma.setupProfile.findFirst({
      where: {
        user: {
          email: user.email,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        roleTitle: true,
        seniority: true,
        resumeText: true,
        jobDescriptionText: true,
      },
    });

    latestProfile = existing;
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Interview setup</h1>
        <p className="text-slate-700">
          Add your resume and target job description to generate role-specific questions.
        </p>
      </div>

      {params.saved === "1" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Setup saved. Continue to practice when you are ready.
        </p>
      )}

      {params.error === "validation" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Please complete all fields. Resume and job description should be detailed enough for AI
          analysis.
        </p>
      )}

      {params.error === "no-setup" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Save your setup details first, then generate a practice session.
        </p>
      )}

      <form action={saveSetupProfile} className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-800">Target role</span>
            <input
              name="roleTitle"
              required
              defaultValue={latestProfile?.roleTitle ?? ""}
              placeholder="Frontend Developer"
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-teal-300 transition focus:ring"
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-slate-800">Seniority level</span>
            <input
              name="seniority"
              required
              defaultValue={latestProfile?.seniority ?? ""}
              placeholder="Junior / Mid / Senior"
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-teal-300 transition focus:ring"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-800">Resume text</span>
          <textarea
            name="resumeText"
            required
            minLength={100}
            defaultValue={latestProfile?.resumeText ?? ""}
            placeholder="Paste your full resume text..."
            rows={10}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-teal-300 transition focus:ring"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-slate-800">Job description text</span>
          <textarea
            name="jobDescriptionText"
            required
            minLength={100}
            defaultValue={latestProfile?.jobDescriptionText ?? ""}
            placeholder="Paste the target job description..."
            rows={10}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-teal-300 transition focus:ring"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-600"
          >
            Save setup
          </button>
          <Link
            href="/practice"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          >
            Go to practice
          </Link>
        </div>
      </form>

      <form action={generatePracticeSession}>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Generate questions from latest setup
        </button>
      </form>
    </main>
  );
}
