"use client";

import { useState, useEffect } from "react";

interface AchievementItem {
  id: string;
  name: string;
  icon: string;
  tier: string;
  description: string;
}

interface AchievementBannerProps {
  achievements: AchievementItem[];
  onDismiss: () => void;
}

const TIER_COLORS: Record<string, string> = {
  bronze: "var(--tier-bronze)",
  silver: "var(--tier-silver)",
  gold: "var(--tier-gold)",
};

const TIER_BG: Record<string, string> = {
  bronze: "color-mix(in srgb, var(--tier-bronze) 8%, transparent)",
  silver: "color-mix(in srgb, var(--tier-silver) 8%, transparent)",
  gold: "color-mix(in srgb, var(--tier-gold) 8%, transparent)",
};

export default function AchievementBanner({
  achievements,
  onDismiss,
}: AchievementBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const current = achievements[currentIndex];

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleNext();
    }, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  function handleNext() {
    if (currentIndex < achievements.length - 1) {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setVisible(true);
      }, 200);
    } else {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }
  }

  if (!current) return null;

  const tierColor = TIER_COLORS[current.tier] ?? TIER_COLORS.gold;
  const tierBg = TIER_BG[current.tier] ?? TIER_BG.gold;

  return (
    <div
      className="transition-all duration-300 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-12px)",
      }}
    >
      <div
        className="rounded-xl border p-4 flex items-center gap-4"
        style={{
          borderColor: tierColor,
          backgroundColor: tierBg,
        }}
      >
        <span className="text-3xl shrink-0">{current.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: tierColor }}
            >
              {current.tier} Achievement Unlocked
            </span>
            {achievements.length > 1 && (
              <span className="text-xs text-[var(--text-muted)]">
                {currentIndex + 1}/{achievements.length}
              </span>
            )}
          </div>
          <p className="font-[family-name:var(--font-display)] font-semibold text-[var(--text-primary)] mt-0.5">
            {current.name}
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {current.description}
          </p>
        </div>
        <button
          onClick={handleNext}
          className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--bg-muted)]"
          style={{ color: tierColor }}
        >
          Nice!
        </button>
      </div>
    </div>
  );
}
