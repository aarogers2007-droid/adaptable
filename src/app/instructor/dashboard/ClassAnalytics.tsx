"use client";

export interface AnalyticsData {
  completionRate: number; // 0-100
  avgLessonsCompleted: number;
  avgTimePerLesson: string; // e.g. "2.5 days"
  activeThisWeek: number;
  totalStudents: number;
  studentProgress: { name: string; completed: number; total: number }[];
  stuckPoints: { lessonTitle: string; count: number }[];
  avgSpeedByLesson: { lessonTitle: string; avgDays: number }[];
}

interface ClassAnalyticsProps {
  data: AnalyticsData;
}

export default function ClassAnalytics({ data }: ClassAnalyticsProps) {
  const maxStuck = Math.max(1, ...data.stuckPoints.map((s) => s.count));
  const maxSpeed = Math.max(1, ...data.avgSpeedByLesson.map((s) => s.avgDays));

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Completion Rate"
          value={`${data.completionRate}%`}
          detail={`${data.totalStudents} students`}
        />
        <StatCard
          label="Avg Lessons Completed"
          value={data.avgLessonsCompleted.toFixed(1)}
          detail={`of ${data.studentProgress[0]?.total ?? 0} total`}
        />
        <StatCard
          label="Avg Time per Lesson"
          value={data.avgTimePerLesson}
          detail="across all students"
        />
        <StatCard
          label="Active This Week"
          value={`${data.activeThisWeek}`}
          detail={`of ${data.totalStudents} students`}
        />
      </div>

      {/* Progress by Student */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
        <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
          Progress by Student
        </h3>
        {data.studentProgress.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">No student data yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {data.studentProgress.map((s) => {
              const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
              return (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-sm text-[var(--text-secondary)]">
                    {s.name}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-[var(--bg-muted)]">
                    <div
                      className="h-3 rounded-full bg-[var(--primary)] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs tabular-nums text-[var(--text-muted)]">
                    {s.completed}/{s.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Where Students Get Stuck */}
      {data.stuckPoints.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
          <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
            Where Students Get Stuck
          </h3>
          <div className="mt-4 space-y-2">
            {data.stuckPoints.map((s) => {
              const pct = Math.round((s.count / maxStuck) * 100);
              const classPct = data.totalStudents > 0
                ? s.count / data.totalStudents
                : 0;
              const isClassStruggle = classPct >= 0.3;
              return (
                <div
                  key={s.lessonTitle}
                  className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${
                    isClassStruggle
                      ? "bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
                      : ""
                  }`}
                >
                  <span className="w-40 shrink-0 truncate text-sm text-[var(--text-secondary)]">
                    {s.lessonTitle}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-[var(--bg-muted)]">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        isClassStruggle ? "bg-amber-500" : "bg-[var(--warning)]"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs tabular-nums text-[var(--text-muted)]">
                    {s.count}{isClassStruggle && (
                      <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">
                        {Math.round(classPct * 100)}%
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          {data.stuckPoints.some(
            (s) => data.totalStudents > 0 && s.count / data.totalStudents >= 0.3
          ) && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
              Highlighted lessons have 30%+ of the class stuck. Consider addressing these in class.
            </p>
          )}
        </div>
      )}

      {/* Avg Speed by Lesson */}
      {data.avgSpeedByLesson.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
          <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
            Avg Time per Lesson
          </h3>
          <div className="mt-4 space-y-2">
            {data.avgSpeedByLesson.map((s) => {
              const pct = Math.round((s.avgDays / maxSpeed) * 100);
              return (
                <div key={s.lessonTitle} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 truncate text-sm text-[var(--text-secondary)]">
                    {s.lessonTitle}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-[var(--bg-muted)]">
                    <div
                      className="h-3 rounded-full bg-[var(--info)] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-xs tabular-nums text-[var(--text-muted)]">
                    {s.avgDays.toFixed(1)} days
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{detail}</p>
    </div>
  );
}
