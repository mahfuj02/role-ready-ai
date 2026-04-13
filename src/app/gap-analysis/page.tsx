// Gap analysis page — coming next
import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ job?: string }> };

export default async function GapAnalysisPage({ searchParams }: Props) {
  const params = await searchParams;
  if (!params.job) redirect("/");
  // Full gap analysis UI will be built in the next step
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#072548" }}>
      <div className="text-center text-white space-y-3">
        <div className="text-4xl animate-spin inline-block">◎</div>
        <p className="text-lg font-semibold">Analysing your profile…</p>
        <p className="text-sm text-slate-400">Gap analysis page coming soon.</p>
      </div>
    </div>
  );
}
