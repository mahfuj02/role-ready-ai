"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/jobs/actions";

export function NewJobForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Job title is required.");
      return;
    }

    setLoading(true);
    try {
      const jobId = await createJob(name.trim(), description.trim() || undefined);
      if (jobId) {
        router.push("/setup");
      } else {
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="mt-px shrink-0">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Job title */}
      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-sm font-medium text-slate-800">
          Job title / Company <span style={{ color: "var(--brand-red)" }}>*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sr. Frontend Developer at Shopify"
          maxLength={120}
          disabled={loading}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-transparent focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": "var(--brand-teal)" } as React.CSSProperties}
          onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px var(--brand-teal)`)}
          onBlur={(e) => (e.target.style.boxShadow = "")}
        />
        <p className="text-xs text-slate-400">
          {name.length}/120 — be specific so you can tell preps apart
        </p>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label htmlFor="description" className="block text-sm font-medium text-slate-800">
          Notes{" "}
          <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Referral from John, deadline April 30th, focus on system design..."
          rows={3}
          maxLength={400}
          disabled={loading}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:outline-none"
          onFocus={(e) => (e.target.style.boxShadow = `0 0 0 2px var(--brand-teal)`)}
          onBlur={(e) => (e.target.style.boxShadow = "")}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: "var(--brand-teal)" }}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating…
            </>
          ) : (
            "Create & go to setup →"
          )}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => router.back()}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
