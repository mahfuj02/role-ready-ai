"use client";

import { useState, useEffect, useTransition } from "react";
import { updateDisplayName, deleteAccount } from "./actions";

const AVATAR_COLORS = [
  { label: "Teal",   value: "#0E7C86" },
  { label: "Navy",   value: "#1e3a5f" },
  { label: "Purple", value: "#7c3aed" },
  { label: "Rose",   value: "#e11d48" },
  { label: "Amber",  value: "#d97706" },
  { label: "Slate",  value: "#475569" },
];

const COLOR_KEY  = "rr_avatar_color";
const NOTIF_KEY  = "rr_notif_practice";

// ── Display name form ─────────────────────────────────────────────────────────

export function DisplayNameForm({
  currentName,
  success,
  error,
}: { currentName: string; success: boolean; error: boolean }) {
  const [name, setName] = useState(currentName);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => startTransition(() => updateDisplayName(fd))}
      className="flex gap-2"
    >
      <input
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
        placeholder="Your display name"
      />
      <button
        type="submit"
        disabled={pending || !name.trim() || name.trim() === currentName}
        className="rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-40"
        style={{ background: "var(--brand-teal)" }}
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {success && <span className="self-center text-xs text-teal-600">✓ Saved</span>}
      {error   && <span className="self-center text-xs text-red-500">Invalid name</span>}
    </form>
  );
}

// ── Avatar colour picker ──────────────────────────────────────────────────────

export function AvatarColorPicker({ initials }: { initials: string }) {
  const [color, setColor] = useState(AVATAR_COLORS[0].value);

  useEffect(() => {
    const saved = localStorage.getItem(COLOR_KEY);
    if (saved) setColor(saved);
  }, []);

  function pick(value: string) {
    setColor(value);
    localStorage.setItem(COLOR_KEY, value);
  }

  return (
    <div className="flex items-center gap-4">
      {/* Preview */}
      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {initials}
      </span>

      {/* Swatches */}
      <div className="flex gap-2">
        {AVATAR_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={c.label}
            onClick={() => pick(c.value)}
            className={`h-7 w-7 rounded-full border-2 transition ${
              color === c.value ? "border-slate-800 scale-110" : "border-transparent hover:scale-105"
            }`}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Notifications toggle ──────────────────────────────────────────────────────

export function NotificationsToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(localStorage.getItem(NOTIF_KEY) === "1");
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(NOTIF_KEY, next ? "1" : "0");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-teal-500" : "bg-slate-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ── Delete account ────────────────────────────────────────────────────────────

export function DeleteAccountButton() {
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
      >
        Delete my account
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <p className="text-sm text-red-700 font-medium">This will delete all your data permanently. Are you sure?</p>
      <button
        type="button"
        onClick={() => startTransition(() => deleteAccount())}
        disabled={pending}
        className="shrink-0 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="shrink-0 text-xs text-slate-500 underline hover:text-slate-700"
      >
        Cancel
      </button>
    </div>
  );
}
