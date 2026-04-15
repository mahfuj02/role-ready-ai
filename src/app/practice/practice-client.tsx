"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitAnswerAction } from "./actions";

// ── Questions loading screen ───────────────────────────────────────────────────

export function QuestionsLoading({ sessionId: _ }: { sessionId: string }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 2500);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
        <span className="h-7 w-7 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
      <div>
        <p className="text-base font-bold text-slate-800">Generating your questions…</p>
        <p className="mt-1 text-sm text-slate-400">This takes about 10–15 seconds. Hang tight!</p>
      </div>
    </div>
  );
}

// ── Voice input ────────────────────────────────────────────────────────────────

type VoiceState = "idle" | "recording" | "processing";

function VoiceInput({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [liveText, setLiveText]     = useState("");
  const [error, setError]           = useState("");
  const [usesWhisper, setUsesWhisper] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef  = useRef<any>(null);
  const recorderRef     = useRef<MediaRecorder | null>(null);
  const chunksRef       = useRef<Blob[]>([]);
  const accumulatedRef  = useRef("");

  // Detect Web Speech API support once on mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    setUsesWhisper(!SR);
  }, []);

  // ── Web Speech API ─────────────────────────────────────────────────────────

  function startWebSpeech() {
    setError("");
    setLiveText("");
    accumulatedRef.current = "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulatedRef.current += t + " ";
        } else {
          interim = t;
        }
      }
      setLiveText(accumulatedRef.current + interim);
    };

    recognition.onerror = () => {
      setError("Microphone error. Please allow microphone access and try again.");
      setVoiceState("idle");
    };

    recognition.onend = () => {
      const final = accumulatedRef.current.trim();
      setVoiceState("idle");
      if (final) onTranscript(final);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setVoiceState("recording");
  }

  function stopWebSpeech() {
    recognitionRef.current?.stop();
  }

  // ── Groq Whisper ────────────────────────────────────────────────────────────

  async function startWhisper() {
    setError("");
    setLiveText("");
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
      return;
    }

    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setVoiceState("processing");

      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const fd   = new FormData();
      fd.append("audio", blob, "recording.webm");

      try {
        const res  = await fetch("/api/transcribe", { method: "POST", body: fd });
        const data = await res.json() as { text?: string; error?: string };
        if (data.text) {
          onTranscript(data.text);
        } else {
          setError("Transcription failed. Please try again or type your answer.");
        }
      } catch {
        setError("Transcription failed. Please try again or type your answer.");
      }

      setVoiceState("idle");
    };

    recorderRef.current = recorder;
    recorder.start();
    setVoiceState("recording");
  }

  function stopWhisper() {
    recorderRef.current?.stop();
  }

  // ── Toggle ─────────────────────────────────────────────────────────────────

  function toggle() {
    if (voiceState === "idle") {
      usesWhisper ? startWhisper() : startWebSpeech();
    } else if (voiceState === "recording") {
      usesWhisper ? stopWhisper() : stopWebSpeech();
    }
  }

  const isRecording   = voiceState === "recording";
  const isProcessing  = voiceState === "processing";

  return (
    <div className="flex flex-col items-center gap-5 rounded-b-2xl rounded-tr-2xl bg-[#1a2332] px-6 py-10">

      {/* Mic button */}
      <button
        type="button"
        onClick={toggle}
        disabled={isProcessing}
        className={[
          "relative flex h-20 w-20 items-center justify-center rounded-full text-3xl shadow-lg transition-all active:scale-95 disabled:opacity-50",
          isRecording
            ? "animate-pulse bg-red-500 text-white shadow-red-500/40"
            : "bg-teal-500 text-white hover:bg-teal-400 shadow-teal-500/30",
        ].join(" ")}
      >
        {isProcessing ? (
          <span className="h-7 w-7 animate-spin rounded-full border-4 border-white border-t-transparent" />
        ) : isRecording ? (
          /* Stop icon */
          <span className="h-6 w-6 rounded bg-white" />
        ) : (
          /* Mic icon */
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-9 w-9">
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2zm-7 9a7 7 0 0 0 14 0h2a9 9 0 0 1-8 8.94V23h-2v-2.06A9 9 0 0 1 3 12h2z"/>
          </svg>
        )}
      </button>

      {/* Status label */}
      <p className="text-sm font-semibold text-slate-300">
        {isProcessing ? "Transcribing…" : isRecording ? "Recording — tap to stop" : "Tap to start speaking"}
      </p>

      {/* Live transcript */}
      {liveText && (
        <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-1">Live transcript</p>
          <p className="text-sm leading-relaxed text-slate-200">{liveText}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs text-red-400">{error}</p>
      )}

      {/* Engine badge */}
      <p className="text-[10px] text-slate-600">
        {usesWhisper ? "Groq Whisper · record then transcribe" : "Web Speech API · live transcription"}
      </p>
    </div>
  );
}

// ── Answer input (type + speak tabs) ──────────────────────────────────────────

export function PracticeAnswerInput({
  sessionId,
  questionId,
  existingAnswer,
}: {
  sessionId: string;
  questionId: string;
  existingAnswer: string | null;
}) {
  const [mode, setMode]           = useState<"type" | "speak">("type");
  const [text, setText]           = useState(existingAnswer ?? "");
  const [isPending, startTransition] = useTransition();

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const canSubmit = text.trim().length >= 20;

  function handleTranscript(transcript: string) {
    setText((prev) => (prev.trim() ? prev.trim() + " " + transcript : transcript));
    setMode("type"); // switch to type tab so user can review + edit
  }

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
      {/* Tab strip */}
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

      {/* Type tab */}
      {mode === "type" && (
        <div className="rounded-b-2xl rounded-tr-2xl overflow-hidden bg-[#1a2332]">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={"Start typing your answer here…\nDescribe the Situation, your Task, the Actions you took, and the Result."}
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
      )}

      {/* Speak tab */}
      {mode === "speak" && (
        <VoiceInput onTranscript={handleTranscript} />
      )}
    </div>
  );
}
