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
  classData: {
    allTime: LeaderboardSet;
    thisWeek: LeaderboardSet;
  };
  schoolData: {
    allTime: LeaderboardSet;
    thisWeek: LeaderboardSet;
  };
  currentStudentId: string;
  hasClass: boolean;
}

type Scope = "class" | "school";
type Timeframe = "all_time" | "this_week";

export default function LeaderboardClient({
  classData,
  schoolData,
  currentStudentId,
  hasClass,
}: LeaderboardClientProps) {
  const [scope, setScope] = useState<Scope>(hasClass ? "class" : "school");
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

  const scopeData = scope === "class" ? classData : schoolData;
  const data = timeframe === "all_time" ? scopeData.allTime : scopeData.thisWeek;

  return (
    <div>
      {/* Filter controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Scope tabs */}
        <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] p-0.5">
          {hasClass && (
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
          )}
          <button
            onClick={() => setScope("school")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              scope === "school"
                ? "bg-[var(--bg)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            School
          </button>
        </div>

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
        />
        <LeaderboardCard
          title="Most Engaged"
          icon="💬"
          entries={data.engagement}
          currentStudentId={currentStudentId}
          metricLabel="messages"
          onStudentClick={handleStudentClick}
        />
        <LeaderboardCard
          title="Deepest Thinker"
          icon="🧠"
          entries={data.depth}
          currentStudentId={currentStudentId}
          metricLabel="checkpoints"
          onStudentClick={handleStudentClick}
        />
        <LeaderboardCard
          title="Most Improved"
          icon="📈"
          entries={data.improved}
          currentStudentId={currentStudentId}
          metricLabel="more than last week"
          onStudentClick={handleStudentClick}
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
