"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  { icon: "◎", label: "Reading your resume…" },
  { icon: "◈", label: "Scanning the job description…" },
  { icon: "✦", label: "Mapping skill gaps…" },
  { icon: "▲", label: "Generating questions…" },
];

export function GapAnalysisWaiting() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 py-20">
      {/* Spinner ring */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span
          className="absolute inset-0 animate-spin rounded-full border-4 border-transparent"
          style={{ borderTopColor: "var(--brand-teal)" }}
        />
        <span className="text-2xl" style={{ color: "var(--brand-teal)" }}>◉</span>
      </div>

      <div className="text-center">
        <p className="text-lg font-bold text-slate-800">Analysing your profile…</p>
        <p className="mt-1 text-sm text-slate-500">This takes about 10–20 seconds.</p>
      </div>

      {/* Step list */}
      <div className="flex flex-col gap-3">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-3 text-sm text-slate-500">
            <span style={{ color: "var(--brand-teal)" }}>{s.icon}</span>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
