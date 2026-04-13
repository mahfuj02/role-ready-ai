import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Logo } from "@/components/logo";
import { NewPrepForm } from "./new-prep-form";

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
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4F8" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-cyan-900/40 bg-[#071f3f]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
          <Logo />

          {/* Center: step label */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
            <span className="font-medium text-slate-200">New prep</span>
            <span>·</span>
            <span>Step 1 of 2</span>
            <div className="ml-2 flex gap-1">
              <span className="h-1.5 w-6 rounded-full bg-cyan-500" />
              <span className="h-1.5 w-6 rounded-full bg-slate-600" />
            </div>
          </div>

          {/* Right: profile */}
          <ProfileDropdown
            displayName={displayName}
            initials={initials}
            signOutAction={handleSignOut}
          />
        </div>
      </header>

      {/* ── Content ── */}
      <main className="mx-auto w-full max-w-4xl px-6 py-8">

        {/* Back + title */}
        <div className="mb-7">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-slate-700"
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
            Set up your prep session
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            We&apos;ll analyse your resume against the job description and build a personalised question set in 30 seconds.
          </p>
        </div>

        <NewPrepForm validationError={params.error === "validation"} />

      </main>
    </div>
  );
}
