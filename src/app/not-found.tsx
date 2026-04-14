import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F0F4F8" }}>
      <header className="sticky top-0 z-50 border-b border-cyan-900/40 bg-[#071f3f]">
        <div className="mx-auto flex w-full max-w-7xl items-center px-6 py-3">
          <Logo />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm max-w-md w-full space-y-5">
          <div className="flex flex-col items-center gap-3">
            <span className="text-6xl font-extrabold text-slate-800 leading-none">404</span>
            <div className="h-1 w-12 rounded-full" style={{ background: "var(--brand-teal)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Page not found</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              That page doesn&apos;t exist — it may have been moved or deleted.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            style={{ background: "var(--brand-teal)" }}
          >
            ← Back to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
