"use client";

import { useState } from "react";
import Link from "next/link";
import type { SkillGap, ResumeSuggestion } from "@/lib/ai/types";

type Question = {
  id: string;
  text: string;
  type: string;
  difficulty: string | null;
  starRecommended: boolean;
};

type TabId = 0 | 1 | 2;
type QFilter = "all" | "BEHAVIORAL" | "TECHNICAL";

const SECTION_META: Record<string, { label: string; cls: string }> = {
  experience: { label: "Experience", cls: "bg-amber-100 text-amber-700" },
  skills:     { label: "Skills",     cls: "bg-teal-100 text-teal-700" },
  projects:   { label: "Projects",   cls: "bg-blue-100 text-blue-700" },
  summary:    { label: "Summary",    cls: "bg-purple-100 text-purple-700" },
};

function likelihoodLabel(d: string | null): { text: string; cls: string } {
  if (d === "EASY") return { text: "Likely",       cls: "bg-blue-50 text-blue-600 border-blue-100" };
  if (d === "HARD") return { text: "Must prepare", cls: "bg-red-50 text-red-600 border-red-100" };
  return               { text: "Very likely",   cls: "bg-rose-50 text-rose-600 border-rose-100" };
}

function gapAction(importance: string) {
  return importance === "critical"
    ? "↓ Add a project or take a short course"
    : "↑ Highlight this in your resume bullets";
}

export function GapAnalysisTabs({
  skillGaps,
  suggestions,
  questions,
  sessionId,
}: {
  skillGaps: SkillGap[];
  suggestions: ResumeSuggestion[];
  questions: Question[];
  sessionId: string | null;
}) {
  const [tab, setTab] = useState<TabId>(0);
  const [qFilter, setQFilter] = useState<QFilter>("all");

  const rewrites = suggestions.filter((s) => s.type === "rewrite" && s.original);
  const bCount = questions.filter((q) => q.type === "BEHAVIORAL").length;
  const tCount = questions.filter((q) => q.type === "TECHNICAL").length;
  const filteredQs = qFilter === "all" ? questions : questions.filter((q) => q.type === qFilter);

  // Each tab has its own semantic colour
  const TABS = [
    {
      icon: "⚑",
      label: "Gap Analysis",
      count: skillGaps.length,
      activeBg:     "bg-red-500",
      activeShadow: "shadow-red-200",
      inactiveText: "text-red-500",
      inactiveBg:   "bg-red-50 hover:bg-red-100 border-red-100",
      countBg:      "bg-red-400/25",
    },
    {
      icon: "✎",
      label: "Resume Tips",
      count: rewrites.length,
      activeBg:     "bg-amber-500",
      activeShadow: "shadow-amber-200",
      inactiveText: "text-amber-600",
      inactiveBg:   "bg-amber-50 hover:bg-amber-100 border-amber-100",
      countBg:      "bg-amber-400/25",
    },
    {
      icon: "◉",
      label: "Questions",
      count: questions.length,
      activeBg:     "bg-teal-600",
      activeShadow: "shadow-teal-200",
      inactiveText: "text-teal-600",
      inactiveBg:   "bg-teal-50 hover:bg-teal-100 border-teal-100",
      countBg:      "bg-teal-500/25",
    },
  ] as const;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      {/* ── Tab bar ── */}
      <div className="flex items-stretch gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
        {TABS.map((t, i) => {
          const active = tab === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setTab(i as TabId)}
              className={[
                "flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-150",
                active
                  ? `${t.activeBg} ${t.activeShadow} border-transparent text-white shadow-md`
                  : `${t.inactiveBg} ${t.inactiveText} border`,
              ].join(" ")}
            >
              <span className={active ? "opacity-90" : "opacity-70"}>{t.icon}</span>
              <span>{t.label}</span>
              <span className={[
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                active ? "bg-white/25 text-white" : t.countBg,
              ].join(" ")}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tab panels ── */}
      <div className="p-5 sm:p-6">

        {/* Tab 0: Gap analysis */}
        {tab === 0 && (
          <div className="space-y-6">
            {skillGaps.length === 0 ? (
              <p className="text-sm text-slate-400">No critical gaps found — great shape!</p>
            ) : (
              skillGaps.map((gap, i) => {
                const isCritical = gap.importance === "critical";
                return (
                  <div key={i} className="flex gap-4">
                    {/* Severity indicator */}
                    <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5 w-14">
                      <span className={`h-3 w-3 rounded-full ${isCritical ? "bg-red-500" : "bg-amber-400"}`} />
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest ${isCritical ? "text-red-500" : "text-amber-500"}`}>
                        {isCritical ? "Missing" : "Weak"}
                      </span>
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 mb-1">{gap.skill}</p>
                      <p className="text-sm text-slate-500 leading-relaxed mb-3">{gap.context}</p>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${
                        isCritical
                          ? "border-teal-200 bg-teal-50 text-teal-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}>
                        {gapAction(gap.importance)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 1: Resume tips */}
        {tab === 1 && (
          <div className="space-y-5">
            {rewrites.length === 0 ? (
              <p className="text-sm text-slate-400">No rewrite suggestions — your bullets look solid.</p>
            ) : (
              rewrites.map((s, i) => {
                const meta = SECTION_META[s.section] ?? { label: s.section, cls: "bg-slate-100 text-slate-600" };
                const title = s.reason.split(/[.!]/)[0].trim().slice(0, 55);
                return (
                  <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.cls}`}>
                        {meta.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">{title}</span>
                    </div>
                    {/* Before / After */}
                    <div className="grid grid-cols-[1fr_36px_1fr] items-center gap-2">
                      <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-3 h-full">
                        <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-widest text-red-400">Current</p>
                        <p className="text-xs leading-relaxed text-red-700 italic">&ldquo;{s.original}&rdquo;</p>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-teal-500 text-base font-bold">→</span>
                        <span className="text-[8px] font-extrabold uppercase tracking-widest text-teal-600 rotate-0">Rewrite</span>
                      </div>
                      <div className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-3 h-full">
                        <p className="mb-1.5 text-[9px] font-extrabold uppercase tracking-widest text-teal-600">Suggested</p>
                        <p className="text-xs leading-relaxed text-teal-800">&ldquo;{s.suggestion}&rdquo;</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Questions */}
        {tab === 2 && (
          <div>
            {/* Filter row */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {(
                [
                  { key: "all" as QFilter,        label: "All",         count: questions.length },
                  { key: "BEHAVIORAL" as QFilter,  label: "Behavioural", count: bCount           },
                  { key: "TECHNICAL" as QFilter,   label: "Technical",   count: tCount           },
                ] as { key: QFilter; label: string; count: number }[]
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setQFilter(f.key)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    qFilter === f.key
                      ? "bg-slate-900 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  {f.label}
                  <span className={qFilter === f.key ? "rounded-full bg-white/20 px-1 text-[10px]" : "text-[10px] text-slate-400"}>
                    {f.count}
                  </span>
                </button>
              ))}
              <span className="ml-auto hidden text-xs text-slate-400 sm:block">
                Click any question to practise it
              </span>
            </div>

            {/* Question list */}
            {questions.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                <span className="animate-spin text-teal-400">◎</span>
                Generating your questions… refresh in a moment.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredQs.map((q) => {
                  const isBehavioral = q.type === "BEHAVIORAL";
                  const lbl = likelihoodLabel(q.difficulty);
                  return (
                    <div
                      key={q.id}
                      onClick={() => sessionId && (window.location.href = `/practice?session=${sessionId}`)}
                      className="group flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3.5 transition hover:border-teal-200 hover:bg-teal-50 hover:shadow-sm"
                    >
                      {/* Badges column */}
                      <div className="flex shrink-0 flex-col gap-1 pt-0.5">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
                          isBehavioral ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                        }`}>
                          {isBehavioral ? "Behavioural" : "Technical"}
                        </span>
                        {q.starRecommended && (
                          <span className="flex items-center gap-0.5 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[9px] font-extrabold text-red-600">
                            ▶ Gap
                          </span>
                        )}
                      </div>
                      {/* Question text */}
                      <p className="flex-1 text-sm text-slate-700 group-hover:text-slate-900">{q.text}</p>
                      {/* Likelihood */}
                      <span className={`shrink-0 self-start rounded-full border px-2 py-0.5 text-[10px] font-semibold ${lbl.cls}`}>
                        {lbl.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Start practising CTA */}
            {sessionId && questions.length > 0 && (
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">
                  {filteredQs.length} of {questions.length} questions shown
                </p>
                <Link
                  href={`/practice?session=${sessionId}`}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
                  style={{ background: "var(--brand-teal)" }}
                >
                  Start practising →
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
