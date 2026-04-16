export default function Loading() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4F8" }}>
      <div className="h-[57px] border-b border-cyan-900/40 bg-[#071f3f]" />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 space-y-4">
        {/* Progress card */}
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-20" />
          </div>
          <div className="flex gap-1">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="skeleton h-2 w-2 rounded-full" />
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* Question card */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-5 w-full" />
              <div className="skeleton h-5 w-3/4" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white h-48 shadow-sm">
              <div className="skeleton h-full rounded-2xl" />
            </div>
          </div>
          {/* Feedback panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-32 w-full rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
