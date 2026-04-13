"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface ProfileDropdownProps {
  displayName: string;
  initials: string;
  signOutAction: () => Promise<void>;
}

export function ProfileDropdown({ displayName, initials, signOutAction }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      {/* Name + avatar pill (non-interactive display) */}
      <div className="flex items-center gap-2 rounded-full border border-cyan-900/60 bg-[#09284f] px-3 py-1.5 text-sm text-slate-200">
        <span className="pl-1 pr-0.5">{displayName}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-600 bg-[#08375b] text-xs font-bold text-cyan-200">
          {initials}
        </span>
      </div>

      {/* Separator dot */}
      <span className="mx-0.5 text-slate-600">·</span>

      {/* Three-dots trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-900/50 bg-[#09284f] text-slate-300 transition hover:bg-[#0a3060] hover:text-white"
        aria-label="More options"
      >
        <span className="text-base leading-none tracking-widest">···</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 z-50 w-44 overflow-hidden rounded-xl border border-cyan-900/50 bg-[#09284f] shadow-xl shadow-black/30">
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5"
          >
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>

          <div className="mx-3 h-px bg-cyan-900/40" />

          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
