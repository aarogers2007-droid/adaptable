"use client";

/* eslint-disable react-hooks/set-state-in-effect -- animation state management */
import { useState, useEffect, useRef } from "react";
import { BadgeDisplay } from "../../ScenariosLibrary";

interface CriteriaLabel {
  id: string;
  label: string;
}

interface Props {
  title: string;
  situation: string;
  industry: string;
  difficulty: number;
  isSponsored: boolean;
  sponsorName: string | null;
  sponsorLogoUrl: string | null;
  criteriaLabels: CriteriaLabel[];
  satisfied: Set<string>;
  attemptNumber: number;
  badgeIcon: string;
  existingBadgeLevel: number | null;
}

const DIFFICULTY_LABELS = ["", "Starter", "Intermediate", "Advanced"];

/**
 * Left panel showing scenario context + criteria progress.
 * Desktop: always visible (30% width).
 * Mobile: collapsible card.
 */
export default function ContextPanel({
  title,
  situation,
  industry,
  difficulty,
  isSponsored,
  sponsorName,
  sponsorLogoUrl,
  criteriaLabels,
  satisfied,
  attemptNumber,
  badgeIcon,
  existingBadgeLevel,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [animating, setAnimating] = useState<Set<string>>(new Set());
  const prevSatisfied = useRef(satisfied);

  // Detect newly satisfied criteria and trigger animation
  useEffect(() => {
    const newlyUnlocked: string[] = [];
    for (const id of satisfied) {
      if (!prevSatisfied.current.has(id)) {
        newlyUnlocked.push(id);
      }
    }
    prevSatisfied.current = satisfied;

    if (newlyUnlocked.length > 0) {
      setAnimating((prev) => {
        const next = new Set(prev);
        for (const id of newlyUnlocked) next.add(id);
        return next;
      });
      // Clear animation after 500ms
      setTimeout(() => {
        setAnimating((prev) => {
          const next = new Set(prev);
          for (const id of newlyUnlocked) next.delete(id);
          return next;
        });
      }, 500);
    }
  }, [satisfied]);

  const content = (
    <div className="space-y-5">
      {/* Scenario info */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] capitalize">
            {industry}
          </span>
          <span className="flex gap-0.5">
            {[1, 2, 3].map((i) => (
              <span key={i} style={{ color: i <= difficulty ? "var(--primary)" : "var(--border)", fontSize: "11px" }}>★</span>
            ))}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">{DIFFICULTY_LABELS[difficulty]}</span>
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--text-primary)]">
          {title}
        </h2>
        {isSponsored && sponsorName && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {sponsorLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sponsorLogoUrl} alt="" className="h-4 w-4 rounded" />
            )}
            <span className="text-[10px] text-[var(--text-muted)]">Sponsored by {sponsorName}</span>
          </div>
        )}
      </div>

      {/* Situation */}
      <div className="max-h-32 overflow-y-auto rounded-lg bg-[var(--bg-muted)] px-3 py-2.5">
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{situation}</p>
      </div>

      {/* Mission / Criteria */}
      <div>
        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Your Mission
        </p>
        <div className="space-y-1.5">
          {criteriaLabels.map((c) => {
            const isSatisfied = satisfied.has(c.id);
            const isAnimatingNow = animating.has(c.id);
            return (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
                style={{
                  background: isSatisfied ? "rgba(13, 148, 136, 0.08)" : "var(--bg)",
                  border: `1px solid ${isSatisfied ? "rgba(13, 148, 136, 0.25)" : "var(--border)"}`,
                  animation: isAnimatingNow ? "criteria-unlock 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards" : "none",
                  transition: "background 300ms ease-out, border-color 300ms ease-out",
                }}
              >
                <span
                  className="text-sm transition-all"
                  style={{
                    color: isSatisfied ? "var(--primary)" : "var(--text-muted)",
                    opacity: isAnimatingNow ? 1 : isSatisfied ? 0.9 : 0.5,
                  }}
                >
                  {isSatisfied ? "✓" : "○"}
                </span>
                <span
                  className="text-xs font-medium transition-colors"
                  style={{ color: isSatisfied ? "var(--primary)" : "var(--text-secondary)" }}
                >
                  {c.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attempt info */}
      <div className="flex items-center gap-3 border-t border-[var(--border)] pt-3">
        <BadgeDisplay icon={badgeIcon} level={existingBadgeLevel} size="small" />
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Attempt {attemptNumber}</p>
          {existingBadgeLevel && (
            <p className="text-[10px] text-[var(--text-muted)]">Best: Level {existingBadgeLevel}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: always visible panel */}
      <aside className="hidden md:block w-[30%] min-w-[260px] max-w-[340px] border-r border-[var(--border)] bg-[var(--bg-subtle)] p-5 overflow-y-auto">
        {content}
      </aside>

      {/* Mobile: collapsible card */}
      <div className="md:hidden border-b border-[var(--border)] bg-[var(--bg-subtle)]">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)]"
        >
          <span>
            {mobileOpen ? "Hide mission" : "Tap to see mission"} — {satisfied.size}/{criteriaLabels.length} unlocked
          </span>
          <span className="text-[var(--text-muted)]">{mobileOpen ? "▲" : "▼"}</span>
        </button>
        {mobileOpen && (
          <div className="px-4 pb-4">
            {content}
          </div>
        )}
      </div>
    </>
  );
}
