"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface AppNavProps {
  isAdmin: boolean;
  studentName?: string;
  /**
   * Preview mode: render the full nav visually but disable every link, the
   * sign-out button, and the admin controls. Used by /demo so an unauthed
   * visitor can see what the real student nav looks like without being
   * ejected to /login the moment they click anything.
   */
  previewMode?: boolean;
}

export default function AppNav({ isAdmin, studentName, previewMode = false }: AppNavProps) {
  const pathname = usePathname();
  const [adminMode, setAdminMode] = useState(isAdmin);
  const [mobileOpen, setMobileOpen] = useState(false);

  const tabs = [
    { href: "/dashboard", label: "My Business", icon: "🏠" },
    { href: "/lessons", label: "Lessons", icon: "📖", matchPrefix: true },
    { href: "/chat", label: "AI Guide", icon: "💬" },
    { href: "/leaderboard", label: "Leaderboard", icon: "📊" },
    { href: "/card", label: "Card", icon: "💳" },
  ];

  function isActive(tab: { href: string; matchPrefix?: boolean }) {
    if (tab.matchPrefix) {
      return pathname.startsWith(tab.href) || pathname.startsWith("/lessons/");
    }
    return pathname === tab.href;
  }

  // In preview mode, every nav link becomes a styled span so the demo
  // visitor sees the full nav UI but clicking nothing ejects them.
  const NavLink = ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) =>
    previewMode ? (
      <span className={className} aria-disabled="true">
        {children}
      </span>
    ) : (
      <Link href={href} className={className}>
        {children}
      </Link>
    );

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:block border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[1200px] items-center gap-1 px-6 py-3">
          <NavLink
            href={adminMode ? "/admin" : "/dashboard"}
            className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--primary)] mr-4"
          >
            Adaptable
          </NavLink>

          {tabs.map((tab) => (
            <NavLink
              key={tab.href}
              href={tab.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                isActive(tab)
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
              }`}
            >
              {tab.label}
            </NavLink>
          ))}

          {isAdmin && !previewMode && (
            <Link
              href="/admin"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                pathname === "/admin"
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
              }`}
            >
              Admin
            </Link>
          )}

          <div className="ml-auto flex items-center gap-3">
            {isAdmin && !previewMode && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdminMode(!adminMode)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors min-h-[44px] ${
                    adminMode
                      ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                      : "bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border)]"
                  }`}
                >
                  {adminMode ? "Admin View" : "Student View"}
                </button>
                <button
                  onClick={() => {
                    if (confirm("Reset everything and start from the very beginning?")) {
                      window.location.href = "/onboarding?reset=true";
                    }
                  }}
                  className="rounded-full px-3 py-1.5 text-xs font-medium bg-[var(--error)]/5 text-[var(--error)] border border-[var(--error)]/20 hover:bg-[var(--error)]/10 transition-colors min-h-[44px]"
                >
                  Fresh Start
                </button>
              </div>
            )}

            {studentName && (
              <span className="text-sm text-[var(--text-muted)]">{studentName}</span>
            )}

            {!previewMode && (
              <form action="/auth/signout" method="POST">
                <button className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] min-h-[44px] px-2">
                  Sign out
                </button>
              </form>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <nav className="md:hidden border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="flex items-center justify-between px-4 py-3">
          <NavLink
            href="/dashboard"
            className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--primary)]"
          >
            Adaptable
          </NavLink>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="border-t border-[var(--border)] px-4 py-3 space-y-1 animate-slide-down">
            {tabs.map((tab) =>
              previewMode ? (
                <span
                  key={tab.href}
                  aria-disabled="true"
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isActive(tab)
                      ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </span>
              ) : (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isActive(tab)
                      ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </Link>
              )
            )}

            {isAdmin && !previewMode && (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    pathname === "/admin"
                      ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                  }`}
                >
                  <span>⚙️</span>
                  Admin
                </Link>
                <button
                  onClick={() => setAdminMode(!adminMode)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] w-full text-left"
                >
                  <span>🔄</span>
                  {adminMode ? "Switch to Student View" : "Switch to Admin View"}
                </button>
              </>
            )}

            <div className="pt-2 border-t border-[var(--border)] mt-2">
              {studentName && (
                <p className="px-3 py-2 text-sm text-[var(--text-muted)]">{studentName}</p>
              )}
              {!previewMode && (
                <form action="/auth/signout" method="POST">
                  <button className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-muted)] w-full text-left">
                    <span>👋</span>
                    Sign out
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
