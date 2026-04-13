"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteJob } from "@/lib/jobs/actions";

export function DeleteJobButton({ jobId, jobName }: { jobId: string; jobName: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await deleteJob(jobId);
      router.refresh();
    });
  }

  return (
    <>
      {/* Trigger — small X in the card corner */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-red-100 hover:text-red-500"
        aria-label="Delete prep"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="3" x2="13" y2="13" />
          <line x1="13" y1="3" x2="3" y2="13" />
        </svg>
      </button>

      {/* Confirm dialog overlay */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mx-auto">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>

            <h2 className="text-center text-base font-bold text-slate-900">Delete this prep?</h2>
            <p className="mt-1.5 text-center text-sm text-slate-500">
              <span className="font-medium text-slate-700">{jobName}</span> and all its questions, answers, and feedback will be permanently deleted.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {isPending ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
