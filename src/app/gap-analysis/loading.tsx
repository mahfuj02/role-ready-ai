export default function Loading() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F4F8" }}>
      <div className="h-[57px] border-b border-cyan-900/40 bg-[#071f3f]" />
      <main className="mx-auto w-full max-w-5xl px-6 py-8 space-y-5">
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-4 w-64" />
        {/* Match score card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="skeleton h-20 w-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-3 w-56" />
            </div>
          </div>
        </div>
        {/* Gap rows */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-3/4" />
          </div>
        ))}
      </main>
    </div>
  );
}
