import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { NewJobForm } from "./new-job-form";

const steps = [
  {
    number: "01",
    title: "Name your prep",
    desc: "Give it a clear name so you can tell preps apart at a glance.",
    active: true,
  },
  {
    number: "02",
    title: "Upload resume & JD",
    desc: "Paste or upload your resume and the target job description.",
    active: false,
  },
  {
    number: "03",
    title: "Get gap analysis",
    desc: "AI maps your resume against the JD and shows exactly what's missing.",
    active: false,
  },
  {
    number: "04",
    title: "Practice & get feedback",
    desc: "Answer role-specific questions. Get STAR coaching after each answer.",
    active: false,
  },
];

export default function NewJobPage() {
  return (
    <AppShell>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-900"
        >
          ← Back to my preps
        </Link>

        {/* Page header */}
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--brand-teal)" }}>
            Step 1 of 4
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            New interview prep
          </h1>
          <p className="text-sm text-slate-500">
            Name your prep so you can identify it in your dashboard. You&apos;ll add
            the resume and job description next.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <NewJobForm />
        </div>

        {/* What happens next */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            What happens next
          </p>
          <div className="grid gap-3">
            {steps.map(({ number, title, desc, active }) => (
              <div
                key={number}
                className={[
                  "flex items-start gap-4 rounded-xl border p-4 transition",
                  active
                    ? "border-teal-200 bg-teal-50"
                    : "border-slate-100 bg-white",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    active
                      ? "text-white"
                      : "bg-slate-100 text-slate-400",
                  ].join(" ")}
                  style={active ? { background: "var(--brand-teal)" } : {}}
                >
                  {number}
                </div>
                <div>
                  <p className={["text-sm font-semibold", active ? "text-teal-800" : "text-slate-700"].join(" ")}>
                    {title}
                  </p>
                  <p className={["mt-0.5 text-xs leading-relaxed", active ? "text-teal-600" : "text-slate-400"].join(" ")}>
                    {desc}
                  </p>
                </div>
                {active && (
                  <span className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: "var(--brand-teal)" }}>
                    You are here
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </main>
    </AppShell>
  );
}
