"use client";

const STEPS = [
  {
    n: 1,
    title: "Upload your resume + JD",
    desc: "Paste the job URL or upload the description. Takes 2 minutes.",
  },
  {
    n: 2,
    title: "Review your gap analysis",
    desc: "See exactly what skills are missing and get tailored questions.",
  },
  {
    n: 3,
    title: "Practice + get STAR feedback",
    desc: "Answer questions by typing or speaking. AI coaches you in real time.",
  },
];

export function OnboardingCard() {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Title */}
      <div className="mb-5 flex items-center gap-3">
        <span className="text-2xl">👋</span>
        <div>
          <p className="font-bold text-slate-900">Welcome! Here&apos;s how RoleReady works</p>
          <p className="text-xs text-slate-400 mt-0.5">3 simple steps to nail your next interview</p>
        </div>
      </div>

      {/* Steps */}
      <div className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
                style={{ background: "var(--brand-teal)" }}
              >
                {s.n}
              </span>
              {i < STEPS.length - 1 && (
                <div className="mt-1 hidden h-full w-px bg-slate-100 sm:block" />
              )}
            </div>
            <div className="pb-1">
              <p className="text-sm font-semibold text-slate-800">{s.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
