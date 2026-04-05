"use client";

import Link from "next/link";

interface AchievementPreviewProps {
  achievements: { id: string; name: string; icon: string; tier: string }[];
}

const TIER_COLORS: Record<string, string> = {
  bronze: "var(--tier-bronze)",
  silver: "var(--tier-silver)",
  gold: "var(--tier-gold)",
};

export default function AchievementPreview({
  achievements,
}: AchievementPreviewProps) {
  const recent = achievements.slice(0, 5);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
          Achievements
        </h3>
        <Link
          href="/achievements"
          className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)]"
        >
          View all →
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          Start earning badges by building your venture!
        </p>
      ) : (
        <div className="flex items-center gap-2">
          {recent.map((a) => {
            const color = TIER_COLORS[a.tier] ?? TIER_COLORS.gold;
            return (
              <div
                key={`${a.id}-${a.tier}`}
                className="flex items-center justify-center w-10 h-10 rounded-lg text-xl"
                style={{
                  backgroundColor: `${color}14`,
                  border: `1.5px solid ${color}40`,
                }}
                title={`${a.name} (${a.tier})`}
              >
                {a.icon}
              </div>
            );
          })}
          {achievements.length > 5 && (
            <span className="text-sm text-[var(--text-muted)] ml-1">
              +{achievements.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
