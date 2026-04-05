"use client";

import type { BusinessIdea, IkigaiResult } from "@/lib/types";

interface StudentDetailStudent {
  id: string;
  full_name: string | null;
  email: string | null;
  enrolled_at: string;
  business_idea: BusinessIdea | null;
  ikigai_result: IkigaiResult | null;
  completedLessons: number;
  totalLessons: number;
  lastActive: string | null;
  lessonProgress: {
    lessonTitle: string;
    moduleSequence: number;
    lessonSequence: number;
    status: string;
    completedAt: string | null;
  }[];
  learningProfile?: Record<string, string> | null;
}

interface StudentDetailProps {
  student: StudentDetailStudent;
  onClose: () => void;
  onMessage: () => void;
}

const IKIGAI_COLORS = {
  love: "#FEF9C3",
  skills: "#ECFCCB",
  needs: "#FFE4E6",
  money: "#CCFBF1",
};

export default function StudentDetail({
  student,
  onClose,
  onMessage,
}: StudentDetailProps) {
  const joinDate = new Date(student.enrolled_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-lg">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)] px-6 py-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)]">
              {student.full_name || "Unnamed Student"}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">{student.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMessage}
              className="rounded-lg border border-[var(--primary)] px-4 py-1.5 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors"
            >
              Message
            </button>
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-3">
              <p className="text-xs text-[var(--text-muted)]">Joined</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{joinDate}</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-3">
              <p className="text-xs text-[var(--text-muted)]">Progress</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {student.completedLessons} / {student.totalLessons} lessons
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-3">
              <p className="text-xs text-[var(--text-muted)]">Last Active</p>
              <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                {student.lastActive
                  ? new Date(student.lastActive).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "Never"}
              </p>
            </div>
          </div>

          {/* Business Idea */}
          {student.business_idea && (
            <section>
              <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
                Business Idea
              </h3>
              <div className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {student.business_idea.name}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Niche</p>
                    <p className="text-[var(--text-secondary)]">{student.business_idea.niche}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Target Customer</p>
                    <p className="text-[var(--text-secondary)]">{student.business_idea.target_customer}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Revenue Model</p>
                    <p className="text-[var(--text-secondary)]">{student.business_idea.revenue_model}</p>
                  </div>
                  {student.business_idea.why_this_fits && (
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">Why it fits</p>
                      <p className="text-[var(--text-secondary)]">{student.business_idea.why_this_fits}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Ikigai */}
          {student.ikigai_result && (
            <section>
              <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
                Ikigai
              </h3>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{ backgroundColor: IKIGAI_COLORS.love }}>
                  <p className="text-xs font-medium text-[var(--text-secondary)]">What I Love</p>
                  <ul className="mt-1.5 space-y-0.5">
                    {(student.ikigai_result.passions ?? []).map((p, i) => (
                      <li key={i} className="text-sm text-[var(--text-primary)]">{p}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: IKIGAI_COLORS.skills }}>
                  <p className="text-xs font-medium text-[var(--text-secondary)]">What I&apos;m Good At</p>
                  <ul className="mt-1.5 space-y-0.5">
                    {(student.ikigai_result.skills ?? []).map((s, i) => (
                      <li key={i} className="text-sm text-[var(--text-primary)]">{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: IKIGAI_COLORS.needs }}>
                  <p className="text-xs font-medium text-[var(--text-secondary)]">What the World Needs</p>
                  <ul className="mt-1.5 space-y-0.5">
                    {(student.ikigai_result.needs ?? []).map((n, i) => (
                      <li key={i} className="text-sm text-[var(--text-primary)]">{n}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: IKIGAI_COLORS.money }}>
                  <p className="text-xs font-medium text-[var(--text-secondary)]">How to Earn</p>
                  <p className="mt-1.5 text-sm text-[var(--text-primary)]">
                    {student.ikigai_result.monetization || "Not specified"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Lesson Progress */}
          <section>
            <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
              Lesson Progress
            </h3>
            <div className="mt-2 space-y-1">
              {student.lessonProgress.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No lessons started yet.</p>
              ) : (
                student.lessonProgress.map((lp, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-[var(--bg-subtle)]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          lp.status === "completed"
                            ? "bg-[var(--success)]"
                            : lp.status === "in_progress"
                            ? "bg-[var(--accent)]"
                            : "bg-[var(--bg-muted)]"
                        }`}
                      />
                      <span className="text-[var(--text-primary)]">
                        {lp.moduleSequence}.{lp.lessonSequence} {lp.lessonTitle}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {lp.status === "completed" && lp.completedAt
                        ? new Date(lp.completedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : lp.status === "in_progress"
                        ? "In progress"
                        : ""}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Learning Profile */}
          {student.learningProfile && Object.keys(student.learningProfile).length > 0 && (
            <section>
              <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
                Learning Profile
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(student.learningProfile).map(([key, value]) => (
                  <span
                    key={key}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-1 text-xs text-[var(--text-secondary)]"
                  >
                    <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span>{" "}
                    {value}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export type { StudentDetailStudent };
