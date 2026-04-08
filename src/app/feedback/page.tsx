import { requireUser } from "@/lib/require-user";

export default async function FeedbackPage() {
  await requireUser();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Feedback</h1>
      <p className="text-slate-700">Answer evaluation and STAR feedback UI will be added next.</p>
    </main>
  );
}
