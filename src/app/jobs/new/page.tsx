import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { ProfileDropdown } from "@/components/profile-dropdown";
import FileUploadExtractor from "@/components/file-upload-extractor";
import { createNewPrep } from "./actions";

const SENIORITY_LEVELS = [
  "Intern",
  "Junior",
  "Mid-level",
  "Senior",
  "Lead",
  "Principal",
  "Staff",
  "Director",
];

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewPrepPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  const params = await searchParams;

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

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f1f4f8" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-cyan-900/40 bg-[#071f3f]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-slate-400 transition hover:text-white text-sm"
            >
              ← Back
            </Link>
            <div className="h-4 w-px bg-cyan-900/60" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-700 text-cyan-100 text-sm">
                ◉
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Prep<span className="text-cyan-400">AI</span>
              </span>
            </div>
          </div>
          <ProfileDropdown
            displayName={displayName}
            initials={initials}
            signOutAction={handleSignOut}
          />
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="mx-auto w-full max-w-3xl px-6 py-10">

        {/* Page heading */}
        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--brand-teal)" }}>
            New prep
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Set up your interview prep
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Add your target role, resume, and job description. We&apos;ll analyse
            the gap and generate tailored practice questions.
          </p>
        </div>

        {/* Error banner */}
        {params.error === "validation" && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="mt-px shrink-0">⚠</span>
            <span>
              Please fill in all fields. Resume and job description should each
              be at least 100 characters.
            </span>
          </div>
        )}

        {/* Form card */}
        <form action={createNewPrep} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">

          {/* Row 1: Target Role + Position Level */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="roleTitle" className="block text-sm font-semibold text-slate-800">
                Target role <span className="text-red-400">*</span>
              </label>
              <input
                id="roleTitle"
                name="roleTitle"
                required
                placeholder="e.g. Sr. Frontend Developer"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="seniority" className="block text-sm font-semibold text-slate-800">
                Position level <span className="text-red-400">*</span>
              </label>
              <select
                id="seniority"
                name="seniority"
                required
                defaultValue=""
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-200 bg-white"
              >
                <option value="" disabled>Select level…</option>
                {SENIORITY_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Resume */}
          <div className="space-y-1.5">
            <label htmlFor="resumeText" className="block text-sm font-semibold text-slate-800">
              Resume <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-3 items-start">
              <textarea
                id="resumeText"
                name="resumeText"
                required
                minLength={100}
                placeholder="Paste your full resume text here…"
                rows={9}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-200 resize-none"
              />
              <div className="w-44 shrink-0">
                <FileUploadExtractor
                  textareaId="resumeText"
                  label="Upload PDF, DOC, or DOCX"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Job Description */}
          <div className="space-y-1.5">
            <label htmlFor="jobDescriptionText" className="block text-sm font-semibold text-slate-800">
              Job description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="jobDescriptionText"
              name="jobDescriptionText"
              required
              minLength={100}
              placeholder="Paste the job description here…"
              rows={7}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-200 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-slate-400">All fields required · Takes ~10 seconds</p>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
              style={{ background: "var(--brand-teal)" }}
            >
              Analyse &amp; continue →
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
