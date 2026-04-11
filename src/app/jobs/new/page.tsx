"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/jobs/actions";

export default function NewJobPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim()) {
      setError("Job name is required");
      setLoading(false);
      return;
    }

    try {
      const jobId = await createJob(name, description);
      if (jobId) {
        router.push(`/setup`);
      } else {
        setError("Failed to create job. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Create New Job Preparation</h1>
        <p className="mt-2 text-slate-600">
          Set up a new interview preparation for a job opportunity.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-slate-200 p-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-900">
            Job Title / Company <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Senior Software Engineer at Google"
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:outline-none"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-slate-500">
            Example: &quot;Product Manager at Meta&quot;, &quot;SWE at Amazon&quot;
          </p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-900">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details about this role or position..."
            rows={3}
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-teal-500 focus:outline-none"
            disabled={loading}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-teal-400 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-teal-300 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create & Continue"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
