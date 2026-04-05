import { createClient } from "@/lib/supabase/server";
import type { Profile, StudentProgress, Lesson, BusinessIdea, IkigaiResult } from "@/lib/types";
import ParentPinForm from "./ParentPinForm";
import ParentMessageForm from "./ParentMessageForm";

export const dynamic = "force-dynamic";

/* ─── Milestone definitions ─── */
interface MilestoneDefinition {
  name: string;
  match: (l: Lesson) => boolean;
}

const MILESTONES: MilestoneDefinition[] = [
  {
    name: "Niche Discovery",
    match: (l) =>
      (l.module_sequence === 1 && l.lesson_sequence >= 1 && l.lesson_sequence <= 2) ||
      // Ikigai is implicitly part of this milestone
      false,
  },
  {
    name: "Know Your Customer",
    match: (l) =>
      (l.module_sequence === 1 && (l.lesson_sequence === 3 || l.lesson_sequence === 4)) ||
      (l.module_sequence === 2 && l.lesson_sequence === 1),
  },
  {
    name: "Pricing & Launch Plan",
    match: (l) =>
      l.module_sequence === 2 && l.lesson_sequence >= 2 && l.lesson_sequence <= 4,
  },
];

/* ─── Helper: relative time ─── */
function relativeTime(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Active today";
  if (diffDays === 1) return "Last active yesterday";
  return `Last active ${diffDays} days ago`;
}

/* ─── Helper: extract summary from artifacts ─── */
function extractSummary(
  artifacts: Record<string, unknown> | null,
  lessonTitle: string,
  decisionText?: string
): string {
  // Prefer the student's own decision journal entry
  if (decisionText) {
    return decisionText;
  }
  if (!artifacts) return `Completed ${lessonTitle}.`;
  // Find the student's longest substantive response as a summary of their thinking
  const conversation = artifacts.conversation as
    | Array<{ role: string; content: string }>
    | undefined;
  if (conversation && conversation.length > 0) {
    const studentMessages = conversation
      .filter((m) => m.role === "user" && m.content.length > 30)
      .sort((a, b) => b.content.length - a.content.length);
    if (studentMessages.length > 0) {
      const best = studentMessages[0].content;
      const trimmed = best.length > 200 ? best.slice(0, 197) + "..." : best;
      return trimmed;
    }
  }
  return `Completed ${lessonTitle}.`;
}

/* ─── Progress Ring SVG ─── */
function ProgressRing({
  percentage,
  size = 140,
  strokeWidth = 10,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-muted)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
        {percentage}%
      </span>
    </div>
  );
}

/* ─── Main page ─── */
export default async function ParentViewPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-subtle)] px-4">
        <div className="text-center">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
            Invalid link
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Ask your student for the correct URL.
          </p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  // Look up student by access token
  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name, business_idea, ikigai_result, parent_access_pin, updated_at, grade_tier")
    .eq("parent_access_token", token)
    .single();

  if (!student) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-subtle)] px-4">
        <div className="text-center">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
            Student not found
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            The link may be expired.
          </p>
        </div>
      </main>
    );
  }

  const typedStudent = student as unknown as Profile & { grade_tier?: string };

  // Fetch class enrollment and teacher info
  const { data: enrollment } = await supabase
    .from("class_enrollments")
    .select("class_id")
    .eq("student_id", typedStudent.id)
    .limit(1)
    .single();

  let teacherName: string | null = null;
  let className: string | null = null;

  if (enrollment) {
    const { data: classData } = await supabase
      .from("classes")
      .select("name, instructor_id")
      .eq("id", enrollment.class_id)
      .single();

    if (classData) {
      className = classData.name;
      const { data: teacher } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", classData.instructor_id)
        .single();
      if (teacher) teacherName = teacher.full_name;
    }
  }

  // Check PIN verification via cookie
  const cookieStore = await (await import("next/headers")).cookies();
  const verifiedCookie = cookieStore.get(`parent_verified_${token}`);
  const hasPin = !!typedStudent.parent_access_pin;

  if (!verifiedCookie || verifiedCookie.value !== "true") {
    return (
      <ParentPinForm
        token={token}
        studentName={typedStudent.full_name ?? "Your student"}
        hasPin={hasPin}
        teacherName={teacherName}
        className={className}
      />
    );
  }

  // ─── Verified: fetch all progress data ───

  // Fetch lessons
  const { data: lessonsData } = await supabase
    .from("lessons")
    .select("id, title, module_name, module_sequence, lesson_sequence")
    .order("module_sequence", { ascending: true })
    .order("lesson_sequence", { ascending: true });

  const lessons = (lessonsData ?? []) as Lesson[];

  // Fetch student progress with lesson join
  const { data: progressData } = await supabase
    .from("student_progress")
    .select("id, student_id, lesson_id, status, artifacts, completed_at, created_at, updated_at")
    .eq("student_id", typedStudent.id);

  const progress = (progressData ?? []) as StudentProgress[];

  // Fetch decision journal entries for richer parent summaries
  const { data: decisionsData } = await supabase
    .from("lesson_decisions")
    .select("lesson_id, decision_text")
    .eq("student_id", typedStudent.id);
  const decisionsByLesson = new Map<string, string>();
  for (const d of decisionsData ?? []) {
    decisionsByLesson.set(d.lesson_id, d.decision_text);
  }

  // Build progress map
  const progressMap = new Map<string, StudentProgress>();
  for (const p of progress) {
    progressMap.set(p.lesson_id, p);
  }

  // Calculate totals
  const ikigaiDone = !!typedStudent.ikigai_result;
  const completedLessons = progress.filter((p) => p.status === "completed").length;
  const totalItems = lessons.length + 1; // +1 for Ikigai
  const completedItems = completedLessons + (ikigaiDone ? 1 : 0);
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Determine last activity
  const timestamps: string[] = [];
  if (typedStudent.updated_at) timestamps.push(typedStudent.updated_at);
  for (const p of progress) {
    if (p.updated_at) timestamps.push(p.updated_at);
    if (p.completed_at) timestamps.push(p.completed_at);
  }
  const lastActivity = timestamps.length > 0
    ? timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
    : null;

  // Build milestone data
  const milestones = MILESTONES.map((def) => {
    const milestoneLessons = lessons.filter(def.match);
    const lessonItems = milestoneLessons.map((lesson) => {
      const prog = progressMap.get(lesson.id);
      return {
        lesson,
        status: prog?.status ?? ("not_started" as const),
        completedAt: prog?.completed_at ?? null,
        artifacts: prog?.artifacts ?? null,
      };
    });

    // For "Niche Discovery", include ikigai as the first item
    const includesIkigai = def.name === "Niche Discovery";
    const totalCount = lessonItems.length + (includesIkigai ? 1 : 0);
    const completedCount =
      lessonItems.filter((li) => li.status === "completed").length +
      (includesIkigai && ikigaiDone ? 1 : 0);

    const isComplete = completedCount === totalCount && totalCount > 0;
    const isActive = !isComplete && completedCount > 0;

    // Find completion date (latest completed_at in the milestone)
    const completionDates = lessonItems
      .filter((li) => li.completedAt)
      .map((li) => li.completedAt!);
    const completionDate = completionDates.length > 0
      ? completionDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

    // Generate summary from latest completed lesson's artifacts
    let summary: string | null = null;
    if (isComplete) {
      const completedWithArtifacts = lessonItems.filter(
        (li) => li.status === "completed" && li.artifacts
      );
      if (completedWithArtifacts.length > 0) {
        const last = completedWithArtifacts[completedWithArtifacts.length - 1];
        const decisionText = decisionsByLesson.get(last.lesson.id);
        summary = extractSummary(last.artifacts, last.lesson.title, decisionText);
      } else {
        summary = `Completed! Your student explored ${def.name.toLowerCase()}.`;
      }
    }

    return {
      name: def.name,
      totalCount,
      completedCount,
      isComplete,
      isActive,
      completionDate,
      summary,
    };
  });

  // Determine if there's a celebration (a milestone was just completed)
  const recentlyCompletedMilestone = milestones.find((m) => {
    if (!m.isComplete || !m.completionDate) return false;
    const completedDate = new Date(m.completionDate);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return completedDate > twoDaysAgo;
  });

  // Compute class average for benchmark
  let classAvgPercentage: number | null = null;
  if (enrollment) {
    const { data: classmates } = await supabase
      .from("class_enrollments")
      .select("student_id")
      .eq("class_id", enrollment.class_id);

    if (classmates && classmates.length > 1) {
      const classmateIds = classmates.map((c) => c.student_id);
      const { data: classProgress } = await supabase
        .from("student_progress")
        .select("student_id, status")
        .in("student_id", classmateIds)
        .eq("status", "completed");

      const completedByStudent = new Map<string, number>();
      for (const cp of classProgress ?? []) {
        completedByStudent.set(cp.student_id, (completedByStudent.get(cp.student_id) ?? 0) + 1);
      }

      let totalPct = 0;
      for (const cId of classmateIds) {
        const count = completedByStudent.get(cId) ?? 0;
        totalPct += totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
      }
      classAvgPercentage = Math.round(totalPct / classmateIds.length);
    }
  }

  // Compute days since last activity (used for inactivity warning + how you can help)
  const daysSinceActive = lastActivity
    ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const businessIdea = typedStudent.business_idea as BusinessIdea | null;
  const ikigaiResult = typedStudent.ikigai_result as IkigaiResult | null;
  const studentFirstName = typedStudent.full_name?.split(" ")[0] ?? "Your student";
  const gradeTierLabel =
    typedStudent.grade_tier === "middle_school"
      ? "Middle School"
      : typedStudent.grade_tier === "elementary"
        ? "Elementary"
        : "High School";

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)]">
      {/* ─── Nav ─── */}
      <nav className="border-b border-[var(--border)] bg-[var(--bg)] px-6 py-4">
        <div className="flex items-center justify-center relative">
          <div className="text-center">
            <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--primary)]">
              Adaptable
            </span>
            <span className="mx-2 text-[var(--text-muted)]">&middot;</span>
            <span className="text-sm text-[var(--text-muted)]">Parent View</span>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        {/* ─── Hero ─── */}
        <section className="text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
            {typedStudent.full_name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-[var(--text-secondary)]">
            {teacherName && <span>{teacherName}</span>}
            {teacherName && className && (
              <span className="text-[var(--text-muted)]">&middot;</span>
            )}
            {className && <span>{className}</span>}
            {(teacherName || className) && (
              <span className="text-[var(--text-muted)]">&middot;</span>
            )}
            <span>{gradeTierLabel}</span>
          </div>
          {lastActivity && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {relativeTime(lastActivity)}
            </p>
          )}
        </section>

        {/* ─── Inactivity Warning ─── */}
        {daysSinceActive !== null && daysSinceActive >= 5 && (
          <section
            className="mt-6 rounded-xl px-4 py-3"
            style={{ backgroundColor: "#FEF3C7" }}
          >
            <p className="text-sm text-[var(--text-secondary)]">
              Last active {daysSinceActive} days ago. If {studentFirstName} needs help,
              their teacher can assist.
            </p>
          </section>
        )}

        {/* ─── Celebration Banner ─── */}
        {recentlyCompletedMilestone && (
          <section
            className="mt-6 rounded-xl p-4 text-center"
            style={{
              background: "linear-gradient(135deg, #ECFDF5, #FFFBEB)",
            }}
          >
            <p className="text-2xl" aria-hidden="true">
              🎉
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
              {studentFirstName} just completed {recentlyCompletedMilestone.name}!
            </p>
          </section>
        )}

        {/* ─── Progress Ring ─── */}
        <section className="mt-8 text-center">
          <ProgressRing percentage={percentage} />
          <p className="mt-3 text-sm font-medium text-[var(--text-secondary)]">
            {completedItems} of {totalItems} steps completed
          </p>
          {classAvgPercentage !== null && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {percentage >= classAvgPercentage + 10
                ? `Ahead of the class average (${classAvgPercentage}%)`
                : percentage >= classAvgPercentage - 10
                  ? `On pace with the class (average ${classAvgPercentage}%)`
                  : `Class average is ${classAvgPercentage}%`}
            </p>
          )}
        </section>

        {/* ─── Business Card ─── */}
        {businessIdea && (
          <section className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Their Business
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)]">
              {businessIdea.name}
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)]">Niche</p>
                <p className="text-sm text-[var(--text-secondary)]">{businessIdea.niche}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)]">Target Customer</p>
                <p className="text-sm text-[var(--text-secondary)]">{businessIdea.target_customer}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[var(--text-muted)]">Revenue Model</p>
                <p className="text-sm text-[var(--text-secondary)]">{businessIdea.revenue_model}</p>
              </div>
            </div>
          </section>
        )}

        {/* ─── Ikigai Overview ─── */}
        {ikigaiResult && (
          <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              What drives {studentFirstName}&apos;s venture
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
              Ikigai (ee-kee-guy) is a Japanese concept for finding purpose at the intersection
              of what you love, what you&apos;re good at, what people need, and what can earn money.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {/* Love / Passions */}
              <div className="rounded-lg p-3" style={{ backgroundColor: "#FEF9C3" }}>
                <p className="text-xs font-semibold text-[var(--text-primary)]">What I Love</p>
                <ul className="mt-1 space-y-0.5">
                  {ikigaiResult.passions.slice(0, 3).map((p) => (
                    <li key={p} className="text-xs text-[var(--text-secondary)]">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Skills */}
              <div className="rounded-lg p-3" style={{ backgroundColor: "#ECFCCB" }}>
                <p className="text-xs font-semibold text-[var(--text-primary)]">What I&apos;m Good At</p>
                <ul className="mt-1 space-y-0.5">
                  {ikigaiResult.skills.slice(0, 3).map((s) => (
                    <li key={s} className="text-xs text-[var(--text-secondary)]">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Needs */}
              <div className="rounded-lg p-3" style={{ backgroundColor: "#FFE4E6" }}>
                <p className="text-xs font-semibold text-[var(--text-primary)]">What the World Needs</p>
                <ul className="mt-1 space-y-0.5">
                  {ikigaiResult.needs.slice(0, 3).map((n) => (
                    <li key={n} className="text-xs text-[var(--text-secondary)]">
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Monetization */}
              <div className="rounded-lg p-3" style={{ backgroundColor: "#CCFBF1" }}>
                <p className="text-xs font-semibold text-[var(--text-primary)]">How to Earn</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {ikigaiResult.monetization}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ─── Milestone Progress ─── */}
        <section className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Milestones
          </p>
          <div className="mt-4 space-y-4">
            {milestones.map((milestone, i) => {
              // Determine lock state: locked if previous milestone isn't complete and this one hasn't started
              const prevComplete = i === 0 || milestones[i - 1].isComplete;
              const isLocked = !milestone.isComplete && !milestone.isActive && !prevComplete;

              return (
                <div
                  key={milestone.name}
                  className={`rounded-lg border p-4 ${
                    milestone.isComplete
                      ? "border-[var(--primary)]/30 bg-[var(--primary)]/5"
                      : milestone.isActive
                        ? "border-[var(--border-strong)] bg-[var(--bg)]"
                        : "border-[var(--border)] bg-[var(--bg-subtle)]"
                  } ${isLocked ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status icon */}
                    <div className="mt-0.5 flex-shrink-0">
                      {milestone.isComplete ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]">
                          <svg
                            className="h-3.5 w-3.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={3}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                        </div>
                      ) : milestone.isActive ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--primary)] bg-[var(--bg)]">
                          <div className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                        </div>
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--bg-subtle)]">
                          {isLocked && (
                            <svg
                              className="h-3 w-3 text-[var(--text-muted)]"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                              />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--text-primary)]">
                        {milestone.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {milestone.completedCount} of {milestone.totalCount} lessons completed
                        {milestone.isComplete && milestone.completionDate && (
                          <span>
                            {" "}
                            &middot; Completed{" "}
                            {new Date(milestone.completionDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </p>
                      {milestone.isComplete && milestone.summary && (
                        <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                          {milestone.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Not Started State ─── */}
        {!businessIdea && !ikigaiResult && completedItems === 0 && (
          <section className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-8 text-center">
            <p className="text-3xl" aria-hidden="true">
              🌱
            </p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
              {studentFirstName} hasn&apos;t started yet
            </p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              When they begin exploring their business idea, their progress will appear here.
            </p>
          </section>
        )}

        {/* ─── How You Can Help ─── */}
        <section
          className="mt-6 rounded-xl p-6"
          style={{ backgroundColor: "#F0FDF4" }}
        >
          <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--text-primary)]">
            How You Can Help
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            {!ikigaiDone
              ? `Ask ${studentFirstName} about their business idea. Sometimes talking through it helps.`
              : daysSinceActive !== null && daysSinceActive >= 5
                ? `A simple "How's your business project going?" at dinner can make a big difference. ${studentFirstName} hasn't been active in a few days.`
                : completedItems === totalItems && totalItems > 0
                  ? `${studentFirstName} finished the program! Ask them to show you their business plan. They've been working on "${businessIdea?.name ?? "their venture"}." Ask what they'd do if they launched tomorrow.`
                  : completedItems > totalItems * 0.5
                    ? `${studentFirstName} is past the halfway mark. Ask about their pricing or who their first customers would be.`
                    : completedItems <= 2
                      ? `Try asking: "What's your business about?" Getting ${studentFirstName} to explain it out loud often gets them unstuck.`
                      : `Ask ${studentFirstName} who their target customer is. They've been researching this — hearing them explain it helps them think clearly.`}
          </p>
        </section>

        {/* ─── Message Teacher ─── */}
        {teacherName && enrollment && (
          <ParentMessageForm
            token={token}
            teacherName={teacherName}
            studentFirstName={studentFirstName}
          />
        )}

        {/* ─── Footer ─── */}
        <footer className="mt-12 mb-8 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Powered by{" "}
            <span className="font-[family-name:var(--font-display)] font-semibold text-[var(--primary)]">
              Adaptable
            </span>{" "}
            &middot; A VentureLab program
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            This view is read-only. Your student&apos;s AI conversations are private.
          </p>
        </footer>
      </div>
    </main>
  );
}
