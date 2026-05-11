"use client";

import Link from "next/link";

interface ScenarioBadge {
  id: string;
  title: string;
  badge_icon: string;
  badge_name: string;
  badgeLevel: number | null;
}

/**
 * Badge Visual System — Three-Level CSS Treatment
 *
 * Level 1: Solid circle, clean emoji. "You did it."
 * Level 2: Ring border + subtle colored glow. "You went deeper."
 * Level 3: Gold ring + radial gradient glow + drop shadow. "Mastery."
 *
 * Locked: Greyscale emoji on muted background.
 */
function SmallBadge({ icon, level }: { icon: string; level: number | null }) {
  if (!level) {
    return (
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 36, height: 36, background: "var(--bg-muted)", filter: "grayscale(1)", opacity: 0.35 }}
      >
        <span style={{ fontSize: 16 }}>{icon}</span>
      </div>
    );
  }

  const styles: Record<number, React.CSSProperties> = {
    1: { width: 36, height: 36, background: "var(--bg-subtle)", border: "2px solid var(--border)" },
    2: { width: 36, height: 36, background: "var(--bg)", border: "2px solid var(--primary)", boxShadow: "0 0 6px rgba(13, 148, 136, 0.2)" },
    3: { width: 36, height: 36, background: "linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%)", border: "2px solid #D97706", boxShadow: "0 0 10px rgba(217, 119, 6, 0.3)" },
  };

  return (
    <div className="flex items-center justify-center rounded-full" style={styles[level]}>
      <span style={{ fontSize: 16 }}>{icon}</span>
    </div>
  );
}

export default function ScenarioBadges({ scenarios }: { scenarios: ScenarioBadge[] }) {
  if (scenarios.length === 0) return null;

  const earned = scenarios.filter((s) => s.badgeLevel);
  const total = scenarios.length;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--text-primary)]">
          Scenario Badges
        </h3>
        <span className="text-xs text-[var(--text-muted)]">
          {earned.length}/{total}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {scenarios.map((s) => (
          <Link key={s.id} href={`/scenarios/${s.id}`} title={`${s.badge_name}${s.badgeLevel ? ` (Level ${s.badgeLevel})` : " — Locked"}`}>
            <SmallBadge icon={s.badge_icon} level={s.badgeLevel} />
          </Link>
        ))}
      </div>
      <Link href="/scenarios" className="mt-3 block text-xs text-[var(--primary)] hover:underline">
        View all scenarios &rarr;
      </Link>
    </div>
  );
}
