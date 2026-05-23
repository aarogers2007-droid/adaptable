"use client";

import { useState } from "react";
import Link from "next/link";

interface ScenarioCard {
  id: string;
  title: string;
  situation: string;
  industry: string;
  difficulty: number;
  rubric_criteria: string[];
  is_sponsored: boolean;
  sponsor_name: string | null;
  badge_name: string;
  badge_icon: string;
  badgeLevel: number | null;
  inProgress: boolean;
}

const INDUSTRIES = ["food", "retail", "logistics", "technology", "healthcare", "finance", "hospitality", "education", "manufacturing"];
const DIFFICULTY_LABELS = ["", "Starter", "Intermediate", "Advanced"];

function DifficultyStars({ level }: { level: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <span key={i} style={{ color: i <= level ? "var(--primary)" : "var(--border)", fontSize: "12px" }}>
          ★
        </span>
      ))}
    </span>
  );
}

/**
 * Badge Visual System — Three-Level CSS Treatment
 *
 * Level 1: Solid circle, clean emoji. "You did it."
 * Level 2: Ring border + subtle colored glow. "You went deeper."
 * Level 3: Gold ring + radial gradient glow + drop shadow. "Mastery."
 *
 * All treatments use the scenario's badge_icon emoji. No external assets.
 * Readable at both card size (40px) and small inline size (24px).
 */
export function BadgeDisplay({ icon, level, size = "card" }: { icon: string; level: number | null; size?: "card" | "small" }) {
  const dim = size === "card" ? 40 : 24;
  const fontSize = size === "card" ? 20 : 14;

  if (!level) {
    // Locked state
    return (
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: dim,
          height: dim,
          background: "var(--bg-muted)",
          filter: "grayscale(1)",
          opacity: 0.4,
        }}
      >
        <span style={{ fontSize }}>{icon}</span>
      </div>
    );
  }

  const styles: Record<number, React.CSSProperties> = {
    1: {
      width: dim,
      height: dim,
      background: "var(--bg-subtle)",
      border: "2px solid var(--border)",
    },
    2: {
      width: dim,
      height: dim,
      background: "var(--bg)",
      border: "2px solid var(--primary)",
      boxShadow: "0 0 8px rgba(13, 148, 136, 0.25)",
    },
    3: {
      width: dim,
      height: dim,
      background: "linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)",
      border: "2px solid #D97706",
      boxShadow: "0 0 12px rgba(217, 119, 6, 0.35), 0 2px 8px rgba(0,0,0,0.1)",
    },
  };

  return (
    <div className="flex items-center justify-center rounded-full" style={styles[level]}>
      <span style={{ fontSize }}>{icon}</span>
    </div>
  );
}

type StatusFilter = "all" | "earned" | "in_progress" | "not_started";

export default function ScenariosLibrary({ scenarios }: { scenarios: ScenarioCard[] }) {
  const [industryFilter, setIndustryFilter] = useState<Set<string>>(new Set());
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = scenarios.filter((s) => {
    if (industryFilter.size > 0 && !industryFilter.has(s.industry)) return false;
    if (difficultyFilter && s.difficulty !== difficultyFilter) return false;
    if (statusFilter === "earned" && !s.badgeLevel) return false;
    if (statusFilter === "in_progress" && !s.inProgress) return false;
    if (statusFilter === "not_started" && (s.badgeLevel || s.inProgress)) return false;
    return true;
  });

  function toggleIndustry(ind: string) {
    const next = new Set(industryFilter);
    if (next.has(ind)) next.delete(ind);
    else next.add(ind);
    setIndustryFilter(next);
  }

  return (
    <div className="mt-6">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* Industry pills */}
        {INDUSTRIES.map((ind) => (
          <button
            key={ind}
            onClick={() => toggleIndustry(ind)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
              industryFilter.has(ind)
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg)]"
            }`}
          >
            {ind}
          </button>
        ))}
        <div className="w-px bg-[var(--border)] mx-1" />
        {/* Difficulty */}
        {[1, 2, 3].map((d) => (
          <button
            key={d}
            onClick={() => setDifficultyFilter(difficultyFilter === d ? null : d)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              difficultyFilter === d
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg)]"
            }`}
          >
            {DIFFICULTY_LABELS[d]}
          </button>
        ))}
        <div className="w-px bg-[var(--border)] mx-1" />
        {/* Status */}
        {(["all", "earned", "in_progress", "not_started"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:bg-[var(--bg)]"
            }`}
          >
            {s === "all" ? "All" : s === "earned" ? "Earned" : s === "in_progress" ? "In Progress" : "Not Started"}
          </button>
        ))}
      </div>

      {/* Scenario grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-8 text-center">No scenarios match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((scenario) => (
            <Link
              key={scenario.id}
              href={`/scenarios/${scenario.id}`}
              className="group rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5 transition-all hover:border-[var(--primary)]/30 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                    {scenario.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)] capitalize">
                      {scenario.industry}
                    </span>
                    <DifficultyStars level={scenario.difficulty} />
                  </div>
                </div>
                <BadgeDisplay icon={scenario.badge_icon} level={scenario.badgeLevel} size="card" />
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)] line-clamp-2">
                {scenario.situation.split(". ").slice(0, 2).join(". ")}.
              </p>
              {scenario.is_sponsored && scenario.sponsor_name && (
                <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                  Sponsored by {scenario.sponsor_name}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
