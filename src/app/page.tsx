import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();

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
          {!session ? (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/setup" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg bg-teal-400 px-5 py-2.5 font-medium text-slate-950 transition hover:bg-teal-300"
              >
                Sign in with Google
              </button>
            </form>
          ) : (
            <>
              <Link
                href="/setup"
                className="rounded-lg bg-teal-400 px-5 py-2.5 font-medium text-slate-950 transition hover:bg-teal-300"
              >
                Start setup
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-slate-700 px-5 py-2.5 font-medium text-slate-100 transition hover:border-slate-500"
                >
                  Sign out
                </button>
              </form>
            </>
          )}
        </div>

        {session?.user && (
          <div className="mt-8 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
            Signed in as {session.user.email ?? "Google user"}
          </div>
        )}

        <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          <Link className="rounded-lg border border-slate-800 p-3 hover:border-teal-300" href="/setup">
            Setup
          </Link>
          <Link className="rounded-lg border border-slate-800 p-3 hover:border-teal-300" href="/practice">
            Practice
          </Link>
          <Link className="rounded-lg border border-slate-800 p-3 hover:border-teal-300" href="/feedback">
            Feedback
          </Link>
          <Link className="rounded-lg border border-slate-800 p-3 hover:border-teal-300" href="/dashboard">
            Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
