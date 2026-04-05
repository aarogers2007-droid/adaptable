"use client";

export interface LeaderboardEntry {
  studentId: string;
  displayName: string;
  rank: number;
  primaryValue: number;
  secondaryValue?: number;
  isCurrentStudent: boolean;
}

interface LeaderboardCardProps {
  title: string;
  icon: string;
  entries: LeaderboardEntry[];
  currentStudentId: string;
  metricLabel: string;
  onStudentClick?: (studentId: string) => void;
}

function getRankColor(rank: number): string | null {
  if (rank === 1) return "var(--tier-gold)";
  if (rank === 2) return "var(--tier-silver)";
  if (rank === 3) return "var(--tier-bronze)";
  return null;
}

export default function LeaderboardCard({
  title,
  icon,
  entries,
  currentStudentId,
  metricLabel,
  onStudentClick,
}: LeaderboardCardProps) {
  const top15 = entries.filter(e => e.rank <= 15);
  const currentInTop = top15.some(e => e.isCurrentStudent);
  const currentEntry = entries.find(e => e.isCurrentStudent);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{icon}</span>
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
      </div>

      {top15.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-4">
          No activity yet. Be the first!
        </p>
      ) : (
        <div className="space-y-0.5">
          {top15.map((entry) => {
            const rankColor = getRankColor(entry.rank);
            return (
              <div
                key={entry.studentId}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  entry.isCurrentStudent
                    ? "bg-[var(--primary)]/8"
                    : ""
                }`}
              >
                <span
                  className="w-6 text-right font-medium tabular-nums shrink-0"
                  style={rankColor ? { color: rankColor } : undefined}
                >
                  {entry.rank}
                </span>
                <span className="truncate flex-1 text-[var(--text-primary)]">
                  {entry.isCurrentStudent ? (
                    <span className="font-medium">{entry.displayName} — You</span>
                  ) : onStudentClick ? (
                    <button
                      onClick={() => onStudentClick(entry.studentId)}
                      className="text-left hover:text-[var(--primary)] transition-colors cursor-pointer"
                    >
                      {entry.displayName}
                    </button>
                  ) : (
                    entry.displayName
                  )}
                </span>
                <span className="shrink-0 text-[var(--text-secondary)] tabular-nums">
                  {entry.primaryValue.toLocaleString()} <span className="text-[var(--text-muted)] text-xs">{metricLabel}</span>
                </span>
              </div>
            );
          })}

          {!currentInTop && currentEntry && (
            <>
              <div className="flex items-center px-3 py-1">
                <span className="text-[var(--text-muted)] text-xs tracking-widest">. . .</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm bg-[var(--primary)]/8">
                <span className="w-6 text-right shrink-0">
                  <span className="text-xs text-[var(--primary)]">&#9650;</span>
                </span>
                <span className="truncate flex-1 text-[var(--text-primary)] font-medium">
                  You — Keep going, you&apos;re climbing!
                </span>
                <span className="shrink-0 text-[var(--text-secondary)] tabular-nums">
                  {currentEntry.primaryValue.toLocaleString()} <span className="text-[var(--text-muted)] text-xs">{metricLabel}</span>
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
