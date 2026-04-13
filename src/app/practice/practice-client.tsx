"use client";

import { useState, useTransition } from "react";
import { submitAnswerAction } from "./actions";

export function PracticeAnswerInput({
  sessionId,
  questionId,
  existingAnswer,
}: {
  sessionId: string;
  questionId: string;
  existingAnswer: string | null;
}) {
  const [mode, setMode] = useState<"type" | "speak">("type");
  const [text, setText] = useState(existingAnswer ?? "");
  const [isPending, startTransition] = useTransition();

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const canSubmit  = text.trim().length >= 20;

  function handleSubmit() {
    if (!canSubmit) return;
    const fd = new FormData();
    fd.append("practiceSessionId", sessionId);
    fd.append("questionId", questionId);
    fd.append("answerText", text.trim());
    startTransition(() => submitAnswerAction(fd));
  }

  return (
    <div className="space-y-0">
      {/* Mode tab strip */}
      <div className="flex border-b border-slate-200">
        {(["type", "speak"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={[
              "flex items-center gap-1.5 border-b-2 px-5 py-2.5 text-sm font-semibold transition",
              mode === m
                ? "border-teal-500 text-slate-800"
                : "border-transparent text-slate-400 hover:text-slate-600",
            ].join(" ")}
          >
            {m === "type" ? (
              <><span className="text-base">≡</span> Type answer</>
            ) : (
              <><span className="text-base">🎙</span> Speak answer</>
            )}
          </button>
        ))}
      </div>

      {/* Answer area */}
      {mode === "type" ? (
        <div className="rounded-b-2xl rounded-tr-2xl overflow-hidden bg-[#1a2332]">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={"Start typing your answer here…\ndescribe the Situation, your Task, the Actions you took, and the Result you achieved."}
            className="w-full resize-none bg-transparent px-5 py-4 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 outline-none"
          />
          <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
            <span className="text-xs text-slate-500">{wordCount} {wordCount === 1 ? "word" : "words"}</span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !canSubmit}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
              style={{ background: canSubmit && !isPending ? "var(--brand-teal)" : undefined }}
            >
              {isPending ? (
                <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Evaluating…</>
              ) : existingAnswer ? "Re-submit →" : "Submit answer →"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-b-2xl rounded-tr-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-12">
          <span className="text-4xl">🎙</span>
          <p className="text-sm font-semibold text-slate-600">Voice input coming soon</p>
          <p className="text-xs text-slate-400">Switch to Type answer to practise now</p>
        </div>
      )}
    </div>
  );
}
