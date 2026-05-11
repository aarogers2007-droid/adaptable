"use client";

import { useState, useCallback } from "react";
import LeaderboardCard from "./LeaderboardCard";
import type { LeaderboardEntry } from "./LeaderboardCard";
import StudentProfile from "./StudentProfile";

interface LeaderboardSet {
  consistency: LeaderboardEntry[];
  engagement: LeaderboardEntry[];
  depth: LeaderboardEntry[];
  improved: LeaderboardEntry[];
}

interface LeaderboardClientProps {
  gradeData: {
    allTime: LeaderboardSet;
    thisWeek: LeaderboardSet;
  };
  classData: {
    allTime: LeaderboardSet;
    thisWeek: LeaderboardSet;
  } | null;
  currentStudentId: string;
  hasClass: boolean;
  totalStudents: number;
}

type Scope = "grade" | "class";
type Timeframe = "all_time" | "this_week";

/**
 * Format rank display: exact rank for 1-100, percentile for 101+.
 */
export function formatRank(rank: number, totalStudents: number): string {
  if (totalStudents <= 1) return "#1";
  if (rank <= 100) return `#${rank}`;
  const percentile = Math.round((1 - (rank - 1) / totalStudents) * 100);
  return `Top ${Math.max(percentile, 1)}%`;
}

export default function LeaderboardClient({
  gradeData,
  classData,
  currentStudentId,
  hasClass,
  totalStudents,
}: LeaderboardClientProps) {
  const [scope, setScope] = useState<Scope>("grade");
  const [timeframe, setTimeframe] = useState<Timeframe>("all_time");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const handleStudentClick = useCallback(
    (studentId: string) => {
      if (studentId !== currentStudentId) {
        setSelectedStudentId(studentId);
      }
    },
    [currentStudentId]
  );

  const scopeData = scope === "class" && classData ? classData : gradeData;
  const data = timeframe === "all_time" ? scopeData.allTime : scopeData.thisWeek;

  return (
    <div>
      {/* Filter controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Scope tabs — only show if student has a class */}
        {hasClass && classData && (
          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] p-0.5">
            <button
              onClick={() => setScope("grade")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                scope === "grade"
                  ? "bg-[var(--bg)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              My Grade
            </button>
            <button
              onClick={() => setScope("class")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                scope === "class"
                  ? "bg-[var(--bg)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              My Class
            </button>
          </div>
        )}

        {/* Timeframe tabs */}
        <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] p-0.5">
          <button
            onClick={() => setTimeframe("all_time")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              timeframe === "all_time"
                ? "bg-[var(--bg)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setTimeframe("this_week")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              timeframe === "this_week"
                ? "bg-[var(--bg)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Leaderboard cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LeaderboardCard
          title="Most Consistent"
          icon="🔥"
          entries={data.consistency}
          currentStudentId={currentStudentId}
          metricLabel={timeframe === "all_time" ? "day streak" : "check-ins"}
          onStudentClick={handleStudentClick}
          totalStudents={totalStudents}
        />
        <LeaderboardCard
          title="Most Engaged"
          icon="💬"
          entries={data.engagement}
          currentStudentId={currentStudentId}
          metricLabel="messages"
          onStudentClick={handleStudentClick}
          totalStudents={totalStudents}
        />
        <LeaderboardCard
          title="Deepest Thinker"
          icon="🧠"
          entries={data.depth}
          currentStudentId={currentStudentId}
          metricLabel="checkpoints"
          onStudentClick={handleStudentClick}
          totalStudents={totalStudents}
        />
        <LeaderboardCard
          title="Most Improved"
          icon="📈"
          entries={data.improved}
          currentStudentId={currentStudentId}
          metricLabel="more than last week"
          onStudentClick={handleStudentClick}
          totalStudents={totalStudents}
        />
      </div>

      {selectedStudentId && (
        <StudentProfile
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
}
