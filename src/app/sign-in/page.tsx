import { signIn } from "@/auth";

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/setup";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-slate-100">
      <main className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <p className="text-sm tracking-[0.2em] text-teal-300">ROLEREADY</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in to continue</h1>
        <p className="mt-3 text-slate-300">
          Use your Google account to access interview setup, practice sessions, and progress history.
        </p>

        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl }, { prompt: "select_account" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-teal-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-teal-300"
          >
            Continue with Google
          </button>
        </form>
      </main>
    </div>
  );
}
