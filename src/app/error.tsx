"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: "#F0F4F8" }}>
      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm max-w-md w-full space-y-5">
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl border border-red-100">
            ⚠
          </span>
          <div className="h-1 w-12 rounded-full bg-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Something went wrong</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            An unexpected error occurred. You can try again or return to the dashboard.
          </p>
          {error.digest && (
            <p className="mt-2 text-[11px] font-mono text-slate-400">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-white hover:border-slate-300"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            style={{ background: "var(--brand-teal)" }}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
