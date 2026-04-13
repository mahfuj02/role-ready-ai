import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Logo } from "@/components/logo";
import { EditResumeForm } from "./edit-form";

type Props = { searchParams: Promise<{ job?: string }> };

export default async function GapAnalysisEditPage({ searchParams }: Props) {
  const params = await searchParams;
  if (!params.job) redirect("/");

  const session = await auth();
  if (!session?.user?.email) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!dbUser) redirect("/sign-in");

  const job = await prisma.job.findFirst({
    where: { id: params.job, userId: dbUser.id },
    include: { setupProfile: true },
  });
  if (!job || !job.setupProfile) redirect("/");

  const setup = job.setupProfile;

  // Parse company / role from job name
  const nameParts   = job.name.split(" - ");
  const companyName = nameParts.length > 1 ? nameParts[0] : "";
  const roleTitle   = setup.roleTitle || (nameParts.length > 1 ? nameParts.slice(1).join(" - ") : job.name);

  const displayName =
    session.user.name?.split(" ").filter(Boolean).slice(0, 2)
      .map((p, i) => (i === 0 ? p : p[0] + ".")).join(" ") || "User";
  const initials =
    session.user.name?.split(" ").filter(Boolean).slice(0, 2)
      .map((p) => p[0]?.toUpperCase()).join("") || "U";

  async function handleSignOut() { "use server"; await signOut({ redirectTo: "/" }); }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4F8" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-cyan-900/40 bg-[#071f3f]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
          <Logo />
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
            <span className="font-medium text-slate-200">Update resume</span>
            <span>·</span>
            <span className="text-slate-400">{companyName ? `${companyName} — ` : ""}{roleTitle}</span>
          </div>
          <ProfileDropdown displayName={displayName} initials={initials} signOutAction={handleSignOut} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-8">

        {/* Back + title */}
        <div className="mb-7">
          <Link
            href={`/gap-analysis?job=${job.id}`}
            className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-slate-700"
          >
            ← Back to analysis
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
            Update your resume
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Job details are locked. Update your resume below to rerun the full gap analysis and regenerate questions.
          </p>
        </div>

        <EditResumeForm
          jobId={job.id}
          setupProfileId={setup.id}
          existingJobId={job.id}
          roleTitle={roleTitle}
          company={companyName}
          seniority={setup.seniority}
          jobDescriptionText={setup.jobDescriptionText}
          resumeText={setup.resumeText}
        />

      </main>
    </div>
  );
}
