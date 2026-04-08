import { requireUser } from "@/lib/require-user";

export default async function SetupPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Setup</h1>
      <p className="text-slate-700">
        Welcome {user.name ?? user.email ?? "candidate"}. Next step is building your setup form for
        resume text, job description, target role, and seniority.
      </p>
    </main>
  );
}
