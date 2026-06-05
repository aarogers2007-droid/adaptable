"use client";

import { useState } from "react";
import type { BusinessIdea, IkigaiResult } from "@/lib/types";

interface LessonHighlight {
  title: string;
  status: "completed" | "in_progress" | "locked";
  completedAt?: string | null;
  bestAnswer?: string;
  sequence: number;
}

interface MyJourneyProps {
  ikigai: IkigaiResult;
  businessIdea: BusinessIdea;
  lessonHighlights: LessonHighlight[];
  totalLessons: number;
}

export default function MyJourney({ ikigai, businessIdea, lessonHighlights, totalLessons }: MyJourneyProps) {
  const [expanded, setExpanded] = useState(true);

  const completedCount = lessonHighlights.filter((l) => l.status === "completed").length;
  const remaining = totalLessons - lessonHighlights.length;

  // Truncate why_this_fits: take first sentence that sounds personal, skip legal disclaimers
  const whyText = (() => {
    if (!businessIdea.why_this_fits) return null;
    const raw = businessIdea.why_this_fits;
    // Cut at "Heads up:" or "Talk to a parent:" disclaimers
    const cutIdx = Math.min(
      raw.includes("Heads up:") ? raw.indexOf("Heads up:") : raw.length,
      raw.includes("Talk to a parent:") ? raw.indexOf("Talk to a parent:") : raw.length,
      raw.includes("\n\n") ? raw.indexOf("\n\n") : raw.length,
    );
    const trimmed = raw.slice(0, cutIdx).trim();
    return trimmed || null;
  })();

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <section className="stagger-enter mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden" style={{ animationDelay: "150ms" }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
        aria-expanded={expanded}
        aria-controls="journey-body"
      >
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <span className="text-base">✦</span>
          My Journey
        </h3>
        <span
          className="text-sm text-[var(--text-muted)] transition-transform duration-200"
          style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {/* Body */}
      {expanded && (
        <div id="journey-body" className="px-5 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Ikigai + Business + Why */}
            <div>
              {/* Ikigai Grid */}
              <div className="grid grid-cols-2 gap-2">
                <IkigaiCell label="What I love" items={ikigai.passions} variant="love" />
                <IkigaiCell label="Good at" items={ikigai.skills} variant="skills" />
                <IkigaiCell label="What people need" items={ikigai.needs} variant="needs" />
                <IkigaiCell label="How I get paid" items={ikigai.monetization ? ikigai.monetization.split(", ") : []} variant="money" />
              </div>

              {/* Business Details */}
              <div className="mt-4">
                <h4 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--text-primary)]">
                  {businessIdea.niche}
                </h4>
                <div className="mt-3 flex flex-col gap-2">
                  <DetailRow label="Customer" value={businessIdea.target_customer} />
                  <DetailRow label="Revenue" value={businessIdea.revenue_model} />
                </div>
              </div>

              {/* Why This Fits */}
              {whyText && (
                <div className="mt-4 p-4 rounded-lg border-l-[3px] border-l-[var(--primary)]" style={{ background: "linear-gradient(135deg, rgba(245,230,66,0.04), rgba(109,213,208,0.04))" }}>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--primary)] mb-2">
                    Why this fits you
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {whyText}
                  </p>
                </div>
              )}
            </div>

            {/* Right: Lesson Timeline */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">
                What you&apos;ve built so far
              </p>

              <div className="flex flex-col">
                {lessonHighlights.map((lesson) => (
                  <div key={lesson.sequence} className="flex gap-3 py-3 border-b border-[var(--border)] last:border-b-0">
                    {/* Dot */}
                    {lesson.status === "completed" ? (
                      <div className="w-7 h-7 min-w-[28px] rounded-full bg-[#059669] text-white flex items-center justify-center text-xs font-bold mt-0.5">
                        ✓
                      </div>
                    ) : lesson.status === "in_progress" ? (
                      <div className="w-7 h-7 min-w-[28px] rounded-full border-2 border-[var(--primary)] text-[var(--primary)] flex items-center justify-center text-xs font-bold mt-0.5">
                        {lesson.sequence}
                      </div>
                    ) : (
                      <div className="w-7 h-7 min-w-[28px] rounded-full border-2 border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center text-xs font-bold mt-0.5 opacity-50">
                        {lesson.sequence}
                      </div>
                    )}

                    {/* Content */}
                    <div className={`flex-1 min-w-0 ${lesson.status === "locked" ? "opacity-50" : ""}`}>
                      <p className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-display)]">
                        {lesson.title}
                      </p>
                      {lesson.status === "completed" && (
                        <p className="text-[11px] font-medium text-[#059669]">
                          {formatDate(lesson.completedAt)}
                        </p>
                      )}
                      {lesson.status === "in_progress" && (
                        <p className="text-[11px] font-medium text-[var(--primary)]">Up next</p>
                      )}
                      {lesson.status === "locked" && (
                        <p className="text-[11px] font-medium text-[var(--text-muted)]">Locked</p>
                      )}
                      {lesson.bestAnswer && (
                        <p className="mt-1 text-[13px] text-[var(--text-secondary)] italic leading-snug line-clamp-3">
                          &ldquo;{lesson.bestAnswer}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {remaining > 0 && (
                <p className="text-xs text-[var(--text-muted)] italic mt-3">
                  {remaining} more milestone{remaining !== 1 ? "s" : ""} ahead...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ── Sub-components ── */

const CELL_STYLES = {
  love: { bg: "rgba(245,230,66,0.15)", label: "#b8a200", pill: "rgba(255,255,255,0.85)" },
  skills: { bg: "rgba(168,219,90,0.15)", label: "#5a8c1a", pill: "rgba(255,255,255,0.75)" },
  needs: { bg: "rgba(244,167,157,0.15)", label: "#c44a3c", pill: "rgba(255,255,255,0.75)" },
  money: { bg: "rgba(109,213,208,0.15)", label: "#1a7a75", pill: "rgba(255,255,255,0.75)" },
} as const;

function IkigaiCell({ label, items, variant }: { label: string; items: string[]; variant: keyof typeof CELL_STYLES }) {
  const style = CELL_STYLES[variant];
  if (!items || items.length === 0) return null;

  return (
    <div className="rounded-lg p-3" style={{ background: style.bg }}>
      <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: style.label }}>
        {label}
      </p>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span
            key={i}
            className="text-xs px-2 py-0.5 rounded-full text-[var(--text-primary)] leading-snug"
            style={{ background: style.pill }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
        {label}
      </p>
      <p className="text-sm text-[var(--text-secondary)] leading-snug">
        {value}
      </p>
    </div>
  );
}
