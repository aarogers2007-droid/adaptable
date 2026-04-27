"use client";

import { useState, useRef } from "react";

type Tab = "how" | "teachers" | "standards" | "faq" | "cta";

const TABS: { key: Tab; label: string }[] = [
  { key: "how", label: "How It Works" },
  { key: "teachers", label: "Teachers" },
  { key: "standards", label: "Standards" },
  { key: "faq", label: "FAQ" },
  { key: "cta", label: "Get Started" },
];

export default function MobileTabs({ children }: { children: React.ReactNode[] }) {
  const [active, setActive] = useState<Tab>("how");
  const ref = useRef<HTMLDivElement>(null);

  const select = (key: Tab) => {
    setActive(key);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Mobile tab bar — hidden on desktop */}
      <div
        ref={ref}
        className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm md:hidden"
      >
        <div className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => select(t.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                active === t.key
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* On mobile, show only the active tab's content. On desktop, show all. */}
      {children.map((child, i) => {
        const tabKey = TABS[i]?.key;
        return (
          <div
            key={tabKey ?? i}
            className={tabKey && active !== tabKey ? "hidden md:block" : "md:block"}
          >
            {child}
          </div>
        );
      })}
    </>
  );
}
