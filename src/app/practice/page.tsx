import { requireUser } from "@/lib/require-user";

export default async function PracticePage() {
  await requireUser();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Practice</h1>
      <p className="text-slate-700">Question runner UI will be implemented in the next phase.</p>
    </main>
  );
}
