"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "My Preps", href: "/" },
  { label: "Setup", href: "/setup" },
  { label: "Practice", href: "/practice" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Feedback", href: "/feedback" },
];

export function AppNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {tabs.map(({ label, href }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={[
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition",
              isActive
                ? "bg-teal-50 text-teal-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
            ].join(" ")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
