"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface AppNavProps {
  isAdmin: boolean;
  studentName?: string;
}

export default function AppNav({ isAdmin, studentName }: AppNavProps) {
  const pathname = usePathname();
  const [adminMode, setAdminMode] = useState(isAdmin);

  const tabs = [
    { href: "/dashboard", label: "My Business" },
    { href: "/lessons", label: "Lessons", matchPrefix: true },
    { href: "/chat", label: "AI Guide" },
  ];

  function isActive(tab: { href: string; matchPrefix?: boolean }) {
    if (tab.matchPrefix) {
      return pathname.startsWith(tab.href) || pathname.startsWith("/lessons/");
    }
    return pathname === tab.href;
  }

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto flex max-w-[1200px] items-center gap-1 px-6 py-3">
        <Link
          href={adminMode ? "/admin" : "/dashboard"}
          className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--primary)] mr-4"
        >
          Adaptable
        </Link>

        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive(tab)
                ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
            }`}
          >
            {tab.label}
          </Link>
        ))}

        {isAdmin && (
          <Link
            href="/admin"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname === "/admin"
                ? "bg-amber-100 text-amber-700"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
            }`}
          >
            Admin
          </Link>
        )}

        <div className="ml-auto flex items-center gap-3">
          {/* Admin/Student toggle */}
          {isAdmin && (
            <button
              onClick={() => setAdminMode(!adminMode)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                adminMode
                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                  : "bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border)]"
              }`}
            >
              {adminMode ? "Admin View" : "Student View"}
            </button>
          )}

          {studentName && (
            <span className="text-sm text-[var(--text-muted)]">{studentName}</span>
          )}

          <form action="/auth/signout" method="POST">
            <button className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
