"use client";

import { useRef, useState, useTransition } from "react";
import { createNewPrep } from "./actions";

const SENIORITY_LEVELS = ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Principal", "Staff", "Director"];

type UploadState = "idle" | "loading" | "success" | "error";

// ── Step indicator ─────────────────────────────────────────────────────────────

function Steps() {
  const steps = [
    { n: 1, label: "Upload & details", sub: "Resume + job description", active: true },
    { n: 2, label: "AI analysis",      sub: "Gap report + questions",   active: false },
    { n: 3, label: "Start practising", sub: "Answer + STAR feedback",   active: false },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={`flex items-center gap-2.5 ${s.active ? "" : "opacity-40"}`}>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold
                ${s.active ? "text-white" : "bg-slate-200 text-slate-500"}`}
              style={s.active ? { background: "var(--brand-teal)" } : {}}
            >
              {s.n}
            </span>
            <span className="hidden sm:block">
              <p className={`text-sm font-semibold ${s.active ? "text-slate-800" : "text-slate-400"}`}>{s.label}</p>
              <p className="text-xs text-slate-400">{s.sub}</p>
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="mx-4 h-px w-12 bg-slate-200 sm:w-16" />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main form ──────────────────────────────────────────────────────────────────

export function NewPrepForm({ validationError }: { validationError?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const resumeRef = useRef<HTMLTextAreaElement>(null);
  const jdRef = useRef<HTMLTextAreaElement>(null);

  const [roleTitle, setRoleTitle] = useState("");
  const [seniority, setSeniority] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");

  const [resumeState, setResumeState] = useState<UploadState>("idle");
  const [resumeMsg, setResumeMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [jdUrl, setJdUrl] = useState("");

  const [isPending, startTransition] = useTransition();

  const isComplete =
    roleTitle.trim().length >= 2 &&
    seniority.length > 0 &&
    resumeText.trim().length >= 100 &&
    jdText.trim().length >= 100;

  // ── File handling ──────────────────────────────────────────────

  async function processFile(file: File) {
    if (!file) return;
    setResumeState("loading");
    setResumeMsg("Extracting text…");

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/extract-text", { method: "POST", body: fd });
      const payload = (await res.json()) as { text?: string; error?: string };

      if (!res.ok || !payload.text) throw new Error(payload.error || "Could not read file.");

      if (resumeRef.current) {
        resumeRef.current.value = payload.text;
        resumeRef.current.dispatchEvent(new Event("input", { bubbles: true }));
      }
      setResumeText(payload.text);
      setResumeState("success");
      setResumeMsg(`${file.name} · ${payload.text.length.toLocaleString()} chars`);
    } catch (e) {
      setResumeState("error");
      setResumeMsg(e instanceof Error ? e.message : "Upload failed.");
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  // ── Submit ─────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => createNewPrep(fd));
  }

  // ── Upload zone style helpers ──────────────────────────────────

  const resumeZoneClass = [
    "upload-zone relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 cursor-pointer text-center",
    isDragging
      ? "border-teal-500 bg-teal-50 shadow-lg shadow-teal-100 -translate-y-1"
      : resumeState === "success"
        ? "border-teal-500 bg-teal-50"
        : "border-teal-300 hover:border-teal-500 hover:border-solid hover:bg-teal-50 hover:shadow-lg hover:shadow-teal-100 hover:-translate-y-0.5",
  ].join(" ");

  const jdZoneClass = [
    "upload-zone flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-5 text-center",
    "border-amber-300 hover:border-amber-400 hover:border-solid hover:bg-amber-50 hover:shadow-lg hover:shadow-amber-100 hover:-translate-y-0.5",
  ].join(" ");

  return (
    <div>
      <Steps />

      {validationError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="mt-px shrink-0">⚠</span>
          <span>Please fill in all fields. Resume and job description must each be at least 100 characters.</span>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">

        {/* ── JOB DETAILS ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Job details</span>
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-500 border border-red-100">Required</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <input
                name="roleTitle"
                required
                placeholder="e.g. Senior Frontend Developer"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div>
              <input
                name="company"
                placeholder="e.g. Shopify (optional)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>
        </div>

        {/* ── RESUME + JD two-column ── */}
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Resume */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Your resume</span>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-500 border border-red-100">Required</span>
            </div>

            {/* Drop zone */}
            <div
              className={resumeZoneClass}
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {resumeState === "success" ? (
                <>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500 text-white text-xl">✓</span>
                  <p className="text-sm font-semibold text-teal-700">File loaded</p>
                  <p className="text-xs text-teal-600">{resumeMsg}</p>
                </>
              ) : resumeState === "loading" ? (
                <>
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-teal-300 border-t-teal-600" />
                  <p className="text-sm text-slate-500">Extracting text…</p>
                </>
              ) : (
                <>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 border border-teal-200 text-teal-500 text-lg">↓</span>
                  <p className="text-sm font-semibold text-slate-700">Drop your resume here</p>
                  <p className="text-xs text-slate-400">PDF or DOCX · Max 5MB</p>
                  {resumeState === "error" && (
                    <p className="text-xs text-red-500">{resumeMsg}</p>
                  )}
                </>
              )}
              <label className="mt-1 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">
                Click to browse files
                <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileInput} />
              </label>
            </div>

            {/* Paste area */}
            <textarea
              ref={resumeRef}
              id="resumeText"
              name="resumeText"
              required
              minLength={100}
              placeholder="Paste your resume text here…"
              rows={6}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              onInput={(e) => setResumeText((e.target as HTMLTextAreaElement).value)}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Job Description */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Job description</span>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-500 border border-red-100">Required</span>
            </div>

            {/* URL zone */}
            <div className={jdZoneClass}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-500 text-lg">⊕</span>
              <p className="text-sm font-semibold text-slate-700">Paste a job URL</p>
              <p className="text-xs text-slate-400">LinkedIn, Greenhouse, Lever — auto-extracted</p>
              <input
                type="url"
                value={jdUrl}
                onChange={(e) => setJdUrl(e.target.value)}
                placeholder="https://jobs.company.com/…"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              <p className="text-xs text-amber-600 font-medium">✦ Auto-extracts everything</p>
            </div>

            {/* Paste area */}
            <textarea
              ref={jdRef}
              id="jobDescriptionText"
              name="jobDescriptionText"
              required
              minLength={100}
              placeholder="Paste the full job description here…"
              rows={6}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>

        {/* ── Position Level (hidden row) ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Position level <span className="text-red-400 font-normal normal-case tracking-normal">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SENIORITY_LEVELS.map((level) => (
              <label key={level} className="cursor-pointer">
                <input
                  type="radio"
                  name="seniority"
                  value={level}
                  required
                  className="peer sr-only"
                  onChange={() => setSeniority(level)}
                />
                <span className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition peer-checked:border-teal-500 peer-checked:bg-teal-50 peer-checked:text-teal-700 hover:border-slate-300 hover:bg-white">
                  {level}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Footer row ── */}
        <div className="flex items-center justify-between pt-1">
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="text-teal-500">🔒</span>
            Private &amp; secure — your data is never shared
          </p>

          <button
            type="submit"
            disabled={!isComplete || isPending}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-bold text-white shadow-sm transition",
              isComplete && !isPending
                ? "animate-shimmer cursor-pointer hover:opacity-90 active:scale-[0.98]"
                : "bg-slate-300 cursor-not-allowed opacity-60",
            ].join(" ")}
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analysing…
              </>
            ) : (
              "Analyse & continue →"
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
