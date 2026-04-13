"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { reanalyseJob } from "../actions";

type UploadState = "idle" | "loading" | "success" | "error";
type ResumeMode = "upload" | "paste";

function CharHint({ len, initial }: { len: number; initial: number }) {
  if (len === 0) return null;
  if (len < 100) return <p className="text-xs text-amber-600">{len}/100 characters minimum</p>;
  if (len !== initial)
    return <p className="text-xs text-teal-600">✓ {len.toLocaleString()} characters — resume updated</p>;
  return <p className="text-xs text-slate-400">✓ {len.toLocaleString()} characters — unchanged</p>;
}

export function EditResumeForm({
  jobId,
  setupProfileId,
  existingJobId,
  roleTitle,
  company,
  seniority,
  jobDescriptionText,
  resumeText: initialResumeText,
}: {
  jobId: string;
  setupProfileId: string;
  existingJobId: string;
  roleTitle: string;
  company: string;
  seniority: string;
  jobDescriptionText: string;
  resumeText: string;
}) {
  const resumeRef = useRef<HTMLTextAreaElement>(null);

  const [resumeMode, setResumeMode]   = useState<ResumeMode>("paste");
  const [resumeLen, setResumeLen]     = useState(initialResumeText.length);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadMsg, setUploadMsg]     = useState("");
  const [isDragging, setIsDragging]   = useState(false);
  const [isPending, startTransition]  = useTransition();

  const initialLen = initialResumeText.trim().length;
  const hasChanged = resumeLen !== initialLen;
  const canSubmit  = resumeLen >= 100;

  // ── File upload ────────────────────────────────────────────────────────────

  async function processFile(file: File) {
    setUploadState("loading");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res     = await fetch("/api/extract-text", { method: "POST", body: fd });
      const payload = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !payload.text) throw new Error(payload.error || "Could not read file.");
      if (resumeRef.current) resumeRef.current.value = payload.text;
      setResumeLen(payload.text.trim().length);
      setUploadState("success");
      setUploadMsg(`${file.name} · ${payload.text.length.toLocaleString()} chars`);
    } catch (e) {
      setUploadState("error");
      setUploadMsg(e instanceof Error ? e.message : "Upload failed.");
    }
  }

  function clearResume() {
    if (resumeRef.current) resumeRef.current.value = "";
    setResumeLen(0);
    setUploadState("idle");
    setUploadMsg("");
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleSubmit() {
    if (!canSubmit || !resumeRef.current) return;
    const fd = new FormData();
    fd.append("jobId", jobId);
    fd.append("setupProfileId", setupProfileId);
    fd.append("resumeText", resumeRef.current.value.trim());
    startTransition(() => reanalyseJob(fd));
  }

  // ── Drop zone styles ───────────────────────────────────────────────────────

  const dropZoneCls = [
    "upload-zone flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer",
    isDragging || uploadState === "success"
      ? "border-teal-500 bg-teal-50 shadow-lg shadow-teal-100 -translate-y-0.5"
      : "border-teal-300 hover:border-teal-500 hover:border-solid hover:bg-teal-50 hover:shadow-md hover:shadow-teal-100 hover:-translate-y-0.5",
  ].join(" ");

  return (
    <div className="space-y-5 pb-28">

      {/* ── Locked job details ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Job details</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-200">
            Read-only
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">Role title</label>
            <input
              value={roleTitle}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">Company</label>
            <input
              value={company || "—"}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-slate-400">Seniority</label>
          <input
            value={seniority}
            readOnly
            className="w-full cursor-not-allowed rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
          />
        </div>
      </div>

      {/* ── Two-column: resume (editable) + JD (locked) ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Resume — editable */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Your resume</span>
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-600 border border-teal-200">
                Editable
              </span>
            </div>
            {/* Upload / Paste toggle */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 w-fit">
              {(["upload", "paste"] as ResumeMode[]).map((m) => (
                <button key={m} type="button" onClick={() => setResumeMode(m)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    resumeMode === m ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {m === "upload" ? "📎 Upload" : "✏️ Paste"}
                </button>
              ))}
            </div>
          </div>

          {/* Drop zone */}
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
                  <p className="text-sm font-semibold text-slate-700">Drop your updated resume here</p>
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

          {/* Always-present textarea (hidden in upload mode) */}
          <textarea
            ref={resumeRef}
            defaultValue={initialResumeText}
            placeholder="Paste your updated resume text here…"
            rows={resumeMode === "paste" ? 12 : 1}
            className={[
              "w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100",
              resumeMode === "paste" ? "" : "hidden",
            ].join(" ")}
            onInput={(e) => setResumeLen((e.target as HTMLTextAreaElement).value.trim().length)}
          />

          <CharHint len={resumeLen} initial={initialLen} />
        </div>

        {/* JD — read-only */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Job description</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-200">
              Read-only
            </span>
          </div>
          <textarea
            value={jobDescriptionText}
            readOnly
            rows={12}
            className="w-full resize-none cursor-not-allowed rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
          />
        </div>
      </div>

      {/* ── Sticky bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-2 min-w-0">
            {hasChanged ? (
              <span className="text-xs text-teal-600 font-medium">✦ Resume updated — ready to reanalyse</span>
            ) : (
              <span className="text-xs text-slate-400">No changes to resume yet</span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {/* View existing analysis (no changes) */}
            {!hasChanged && (
              <Link
                href={`/gap-analysis?job=${existingJobId}`}
                className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold transition hover:opacity-80"
                style={{ borderColor: "var(--brand-teal)", color: "var(--brand-teal)", background: "#fff" }}
              >
                View current analysis →
              </Link>
            )}

            {/* Reanalyse button (only shown when changed) */}
            {hasChanged && (
              <button
                type="button"
                disabled={isPending || !canSubmit}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
                style={{ background: canSubmit ? "var(--brand-teal)" : "#cbd5e1", cursor: canSubmit ? "pointer" : "not-allowed" }}
              >
                {isPending ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Reanalysing…</>
                ) : "Reanalyse & continue →"}
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
