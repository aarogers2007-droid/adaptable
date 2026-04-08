"use client";

import { useState } from "react";

interface DemoAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
}

// Curated subset of the real achievement set — enough variety to show the
// full tier spectrum without dumping the whole 25-achievement gallery on a
// demo visitor. The icons + names are pulled from src/lib/achievements.ts.
const DEMO_ACHIEVEMENTS: DemoAchievement[] = [
  { id: "venture-founded", name: "Venture Founded", description: "Completed the Ikigai wizard.", icon: "🚀", tier: "gold" },
  { id: "named-and-claimed", name: "Named & Claimed", description: "Filled in your business name, niche, customer, and revenue model.", icon: "🏷️", tier: "gold" },
  { id: "know-thy-customer", name: "Know Thy Customer", description: "Completed the customer interview sandbox.", icon: "🎤", tier: "silver" },
  { id: "price-is-right", name: "Price Is Right", description: "Set your pricing strategy in the pricing lesson.", icon: "💰", tier: "silver" },
  { id: "first-decision", name: "First Decision", description: "Logged your first decision in the decision journal.", icon: "💡", tier: "bronze" },
  { id: "five-decisions", name: "Decision Maker", description: "Five decisions journaled — you're committing in writing.", icon: "🧠", tier: "silver" },
  { id: "streak-week", name: "On Fire", description: "Seven-day check-in streak.", icon: "🔥", tier: "silver" },
  { id: "launch-ready", name: "Launch Ready", description: "Completed all 22 lessons and built a real plan.", icon: "🎓", tier: "gold" },
];

const TIER_COLORS = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#d4af37",
};

export default function DemoAchievements() {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setUnlocked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const unlockAll = () => setUnlocked(new Set(DEMO_ACHIEVEMENTS.map((a) => a.id)));
  const reset = () => setUnlocked(new Set());

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider">
            The achievement gallery
          </p>
          <p className="mt-2 text-base text-[var(--text-secondary)]">
            Click any badge to unlock it. Real students earn these as they progress.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={unlockAll}
            className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors"
          >
            Unlock all
          </button>
          <button
            onClick={reset}
            className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-muted)] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {DEMO_ACHIEVEMENTS.map((a) => {
          const isEarned = unlocked.has(a.id);
          const tierColor = TIER_COLORS[a.tier];
          return (
            <button
              key={a.id}
              onClick={() => toggle(a.id)}
              className="rounded-xl border p-4 text-left transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              style={{
                borderColor: isEarned ? `${tierColor}80` : "var(--border)",
                backgroundColor: isEarned ? `${tierColor}10` : "var(--bg)",
                opacity: isEarned ? 1 : 0.55,
                boxShadow: isEarned ? `0 0 20px ${tierColor}30, 0 0 40px ${tierColor}15` : undefined,
              }}
              aria-pressed={isEarned}
              aria-label={`${a.name} — ${isEarned ? "earned" : "locked"}, click to ${isEarned ? "lock" : "unlock"}`}
            >
              <div className="relative">
                <span
                  className="text-3xl block transition-all duration-300"
                  style={{ filter: isEarned ? "none" : "grayscale(100%)" }}
                >
                  {a.icon}
                </span>
                {!isEarned && (
                  <span className="absolute -bottom-1 -right-1 text-xs">🔒</span>
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-[var(--text-primary)] leading-tight">
                {a.name}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)] leading-snug line-clamp-2">
                {a.description}
              </p>
              <p
                className="mt-2 text-[10px] uppercase tracking-wider font-bold"
                style={{ color: isEarned ? tierColor : "var(--text-muted)" }}
              >
                {a.tier}
              </p>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-[var(--text-muted)] text-center">
        Real students see these unlock with a celebration animation as they hit each milestone.
      </p>
    </div>
  );
}
