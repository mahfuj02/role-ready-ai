// Dashboard loading skeleton
export default function Loading() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f1f4f8" }}>
      {/* Header */}
      <div className="h-[57px] border-b border-cyan-900/40 bg-[#071f3f]" />

      {/* Hero */}
      <div className="border-b border-cyan-900/30 bg-[#072548] px-6 py-12">
        <div className="mx-auto max-w-6xl space-y-3">
          <div className="skeleton h-4 w-24 opacity-30" />
          <div className="skeleton h-8 w-72 opacity-30" />
          <div className="skeleton h-4 w-48 opacity-20" />
        </div>
      </div>

      {/* Stats row */}
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2">
              <div className="skeleton h-2.5 w-20" />
              <div className="skeleton h-8 w-12" />
              <div className="skeleton h-2 w-16" />
            </div>
          ))}
        </div>

        {/* Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="skeleton h-9 w-9 rounded-xl" />
                <div className="space-y-1.5 flex-1">
                  <div className="skeleton h-3 w-16" />
                  <div className="skeleton h-4 w-32" />
                </div>
              </div>
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-1.5 w-full" />
              <div className="flex gap-2 pt-2">
                <div className="skeleton h-9 flex-1 rounded-xl" />
                <div className="skeleton h-9 flex-1 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
