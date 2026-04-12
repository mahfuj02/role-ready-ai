"use client";

import { useState } from "react";

type FileUploadExtractorProps = {
  textareaId: string;
  label: string;
};

export default function FileUploadExtractor({ textareaId, label }: FileUploadExtractorProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("");

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setStatus("loading");
    setMessage("Extracting text from file...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as { text?: string; error?: string };

      if (!response.ok || !payload.text) {
        throw new Error(payload.error || "Could not extract text from this file.");
      }

      const target = document.getElementById(textareaId) as HTMLTextAreaElement | null;
      if (!target) {
        throw new Error("Target field is missing on the page.");
      }

      target.value = payload.text;
      target.dispatchEvent(new Event("input", { bubbles: true }));

      setStatus("success");
      setMessage(`Loaded ${payload.text.length.toLocaleString()} characters from ${file.name}.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <label className="block text-sm font-medium text-slate-800">
        {label}
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={onFileChange}
          className="mt-2 block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
        />
      </label>

      {status !== "idle" && (
        <p
          className={
            status === "error"
              ? "mt-2 text-xs text-red-700"
              : status === "success"
                ? "mt-2 text-xs text-emerald-700"
                : "mt-2 text-xs text-slate-600"
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
