"use client";

import { useState, useTransition } from "react";
import { reanalyseJob } from "./actions";

export function UpdateResumeForm({
  jobId,
  setupProfileId,
  currentResumeText,
}: {
  jobId: string;
  setupProfileId: string;
  currentResumeText: string;
}) {
  const [open, setOpen]     = useState(false);
  const [text, setText]     = useState(currentResumeText);
  const [isPending, start]  = useTransition();

  const charCount = text.trim().length;
  const canSubmit = charCount >= 100;

  function handleSubmit() {
    if (!canSubmit) return;
    const fd = new FormData();
    fd.append("jobId", jobId);
    fd.append("setupProfileId", setupProfileId);
    fd.append("resumeText", text.trim());
    start(() => reanalyseJob(fd));
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header — always visible, toggles the form */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-sm">✎</span>
          <div>
            <p className="text-sm font-bold text-slate-800">Update your resume</p>
            <p className="text-xs text-slate-400">Paste a newer version to rerun the full gap analysis</p>
          </div>
        </div>
        <span className={`text-slate-400 text-lg font-light transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          ⌄
        </span>
      </button>

      {/* Expandable body */}
      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-3">
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-2.5">
            <p className="text-xs text-amber-700">
              <span className="font-bold">Heads up:</span> this will delete your current gap analysis and regenerate everything — gaps, resume tips, and all questions.
            </p>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Paste your updated resume text here…"
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
          />

          <div className="flex items-center justify-between">
            <span className={`text-xs ${canSubmit ? "text-teal-600" : "text-slate-400"}`}>
              {canSubmit ? `✓ ${charCount.toLocaleString()} characters` : `${charCount}/100 characters minimum`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || isPending}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50"
                style={{ background: canSubmit && !isPending ? "var(--brand-teal)" : "#94a3b8" }}
              >
                {isPending ? (
                  <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Reanalysing…</>
                ) : "Reanalyse & continue →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
