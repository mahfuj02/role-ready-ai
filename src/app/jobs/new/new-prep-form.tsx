"use client";

import { useRef, useState, useTransition } from "react";
import { createNewPrep } from "./actions";

const SENIORITY_LEVELS = ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Principal", "Staff", "Director"];

type UploadState = "idle" | "loading" | "success" | "error";
type ResumeMode = "upload" | "paste";
type JdMode = "paste" | "url";

// ── Step indicator ─────────────────────────────────────────────────────────────

function Steps() {
  return (
    <div className="flex items-center gap-0 mb-8">
      {[
        { n: 1, label: "Upload & details", sub: "Resume + job description", active: true },
        { n: 2, label: "AI analysis",      sub: "Gap report + questions",   active: false },
        { n: 3, label: "Start practising", sub: "Answer + STAR feedback",   active: false },
      ].map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className={`flex items-center gap-2.5 ${s.active ? "" : "opacity-40"}`}>
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={s.active ? { background: "var(--brand-teal)", color: "#fff" } : { background: "#e2e8f0", color: "#94a3b8" }}
            >
              {s.n}
            </span>
            <span className="hidden sm:block">
              <p className={`text-sm font-semibold ${s.active ? "text-slate-800" : "text-slate-400"}`}>{s.label}</p>
              <p className="text-xs text-slate-400">{s.sub}</p>
            </span>
          </div>
          {i < 2 && <div className="mx-4 h-px w-12 bg-slate-200 sm:w-16" />}
        </div>
      ))}
    </div>
  );
}

// ── Tab toggle ─────────────────────────────────────────────────────────────────

function ModeTab<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 w-fit">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
            value === o.value ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Character count hint ───────────────────────────────────────────────────────

function CharHint({ len }: { len: number }) {
  if (len === 0) return null;
  if (len < 100) return <p className="text-xs text-amber-600">{len}/100 characters minimum</p>;
  return <p className="text-xs text-teal-600">✓ {len.toLocaleString()} characters</p>;
}

// ── Main form ──────────────────────────────────────────────────────────────────

export function NewPrepForm({ validationError }: { validationError?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);

  // One ref per textarea that lives in the form
  const resumeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const jdTextareaRef     = useRef<HTMLTextAreaElement>(null);

  // Mode toggles
  const [resumeMode, setResumeMode] = useState<ResumeMode>("upload");
  const [jdMode,     setJdMode]     = useState<JdMode>("paste");

  // Length tracking — drives pill state + isComplete
  const [roleLen,    setRoleLen]    = useState(0);
  const [resumeLen,  setResumeLen]  = useState(0);
  const [jdLen,      setJdLen]      = useState(0);
  const [seniority,  setSeniority]  = useState("");

  // Upload state for resume
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadMsg,   setUploadMsg]   = useState("");
  const [isDragging,  setIsDragging]  = useState(false);

  // JD URL (UI only for now)
  const [jdUrl, setJdUrl] = useState("");

  const [isPending, startTransition] = useTransition();

  // Completion
  const hasRole      = roleLen >= 2;
  const hasResume    = resumeLen >= 100;
  const hasJd        = jdLen >= 100;
  const hasSeniority = seniority.length > 0;
  const isComplete   = hasRole && hasResume && hasJd && hasSeniority;

  function missingHint() {
    if (!hasRole)      return "Add a target role to continue";
    if (!hasResume)    return "Add your resume to continue";
    if (!hasJd)        return "Add the job description to continue";
    if (!hasSeniority) return "Select your position level to continue";
    return "All set — ready to analyse ✓";
  }

  // ── File upload ───────────────────────────────────────────────────────────────

  async function processFile(file: File) {
    setUploadState("loading");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res     = await fetch("/api/extract-text", { method: "POST", body: fd });
      const payload = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !payload.text) throw new Error(payload.error || "Could not read file.");
      // Write directly into the textarea that's always in the form
      if (resumeTextareaRef.current) {
        resumeTextareaRef.current.value = payload.text;
      }
      setResumeLen(payload.text.trim().length);
      setUploadState("success");
      setUploadMsg(`${file.name} · ${payload.text.length.toLocaleString()} chars`);
    } catch (e) {
      setUploadState("error");
      setUploadMsg(e instanceof Error ? e.message : "Upload failed.");
    }
  }

  function clearResume() {
    if (resumeTextareaRef.current) resumeTextareaRef.current.value = "";
    setResumeLen(0);
    setUploadState("idle");
    setUploadMsg("");
  }

  // ── Drop zone styles ──────────────────────────────────────────────────────────

  const dropZoneCls = [
    "upload-zone flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer",
    isDragging || uploadState === "success"
      ? "border-teal-500 bg-teal-50 shadow-lg shadow-teal-100 -translate-y-0.5"
      : "border-teal-300 hover:border-teal-500 hover:border-solid hover:bg-teal-50 hover:shadow-md hover:shadow-teal-100 hover:-translate-y-0.5",
  ].join(" ");

  return (
    <div>
      <Steps />

      {validationError && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="mt-px shrink-0">⚠</span>
          Please fill in all fields. Resume and job description must be at least 100 characters.
        </div>
      )}

      <form id="new-prep-form" ref={formRef} noValidate className="space-y-5 pb-28">

        {/* ── JOB DETAILS ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Job details</span>
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-500 border border-red-100">Required</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="roleTitle"
              placeholder="e.g. Senior Frontend Developer"
              onInput={(e) => setRoleLen((e.target as HTMLInputElement).value.trim().length)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
            <input
              name="company"
              placeholder="e.g. Shopify (optional)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        {/* ── RESUME + JD ── */}
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Resume card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Your resume</span>
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-500 border border-red-100">Required</span>
              </div>
              <ModeTab
                options={[
                  { value: "upload" as ResumeMode, label: "📎 Upload" },
                  { value: "paste"  as ResumeMode, label: "✏️ Paste"  },
                ]}
                value={resumeMode}
                onChange={(v) => {
                  setResumeMode(v);
                  // When switching to paste, re-read current textarea length
                  if (v === "paste") {
                    setResumeLen(resumeTextareaRef.current?.value.trim().length ?? 0);
                  }
                }}
              />
            </div>

            {/* Upload zone — visible only in upload mode */}
            {resumeMode === "upload" && (
              <div
                className={dropZoneCls}
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragOver={(e)  => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
              >
                {uploadState === "success" ? (
                  <>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500 text-white text-xl">✓</span>
                    <p className="text-sm font-semibold text-teal-700">File loaded</p>
                    <p className="text-xs text-teal-600">{uploadMsg}</p>
                    <button type="button" onClick={clearResume} className="text-xs text-slate-400 underline hover:text-slate-600">Remove</button>
                  </>
                ) : uploadState === "loading" ? (
                  <>
                    <span className="h-8 w-8 animate-spin rounded-full border-2 border-teal-300 border-t-teal-600" />
                    <p className="text-sm text-slate-500">Extracting text…</p>
                  </>
                ) : (
                  <>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 border border-teal-200 text-teal-500 text-lg">↓</span>
                    <p className="text-sm font-semibold text-slate-700">Drop your resume here</p>
                    <p className="text-xs text-slate-400">PDF or DOCX · Max 5MB</p>
                    {uploadState === "error" && <p className="text-xs text-red-500">{uploadMsg}</p>}
                    <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">
                      Click to browse files
                      <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
                    </label>
                  </>
                )}
              </div>
            )}

            {/*
              THE key textarea — always in the form with name="resumeText".
              Visible in paste mode, hidden in upload mode (file upload writes to it directly).
            */}
            <textarea
              ref={resumeTextareaRef}
              name="resumeText"
              placeholder="Paste your full resume text here…"
              rows={resumeMode === "paste" ? 10 : 1}
              className={[
                "w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100",
                resumeMode === "paste" ? "" : "hidden",
              ].join(" ")}
              onInput={(e) => setResumeLen((e.target as HTMLTextAreaElement).value.trim().length)}
            />

            <CharHint len={resumeLen} />
          </div>

          {/* JD card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Job description</span>
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-500 border border-red-100">Required</span>
              </div>
              <ModeTab
                options={[
                  { value: "paste" as JdMode, label: "✏️ Paste" },
                  { value: "url"   as JdMode, label: "🔗 URL"   },
                ]}
                value={jdMode}
                onChange={setJdMode}
              />
            </div>

            {/* URL zone — visible only in url mode */}
            {jdMode === "url" && (
              <div className="upload-zone flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 p-5 text-center hover:border-amber-400 hover:border-solid hover:bg-amber-50 hover:shadow-md hover:shadow-amber-100 hover:-translate-y-0.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-500 text-lg">⊕</span>
                <p className="text-sm font-semibold text-slate-700">Paste a job URL</p>
                <p className="text-xs text-slate-400">LinkedIn, Greenhouse, Lever</p>
                <input
                  type="url"
                  value={jdUrl}
                  onChange={(e) => setJdUrl(e.target.value)}
                  placeholder="https://jobs.company.com/…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
                <p className="text-xs text-amber-500 font-medium">✦ URL extraction coming soon</p>
              </div>
            )}

            {/* THE key textarea — always in form with name="jobDescriptionText" */}
            <textarea
              ref={jdTextareaRef}
              name="jobDescriptionText"
              placeholder="Paste the full job description here…"
              rows={jdMode === "paste" ? 10 : 5}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
              onInput={(e) => setJdLen((e.target as HTMLTextAreaElement).value.trim().length)}
            />

            <CharHint len={jdLen} />
          </div>
        </div>

        {/* ── Position Level ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Position level <span className="text-red-400 font-normal normal-case tracking-normal">*</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {SENIORITY_LEVELS.map((level) => (
              <label key={level} className="cursor-pointer">
                <input type="radio" name="seniority" value={level} className="peer sr-only"
                  onChange={() => setSeniority(level)} />
                <span className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition peer-checked:border-teal-500 peer-checked:bg-teal-50 peer-checked:text-teal-700 hover:border-slate-300 hover:bg-white">
                  {level}
                </span>
              </label>
            ))}
          </div>
        </div>

      </form>

      {/* ── Sticky bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 text-sm">🔒</span>
            <span className="text-xs text-slate-500 truncate">{missingHint()}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {/* Progress pills */}
            <div className="hidden sm:flex items-center gap-1.5">
              {([
                { ok: hasRole,      label: "Role"   },
                { ok: hasResume,    label: "Resume" },
                { ok: hasJd,        label: "JD"     },
                { ok: hasSeniority, label: "Level"  },
              ] as { ok: boolean; label: string }[]).map(({ ok, label }) => (
                <span key={label}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${ok ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-400"}`}>
                  {ok ? "✓ " : ""}{label}
                </span>
              ))}
            </div>

            {/* Submit button */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!isComplete || isPending) return;
                const form = formRef.current;
                if (!form) return;
                startTransition(() => createNewPrep(new FormData(form)));
              }}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
              style={{
                background: isComplete ? "var(--brand-teal)" : "#cbd5e1",
                cursor: isComplete ? "pointer" : "not-allowed",
                opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Analysing…</>
              ) : "Analyse & continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
