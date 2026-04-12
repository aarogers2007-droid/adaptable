import { LESSON_PLANS } from "@/lib/lesson-plans";

interface FoundersLogEntry {
  id: string;
  trigger_type: string;
  lesson_id: number | null;
  mirror_prompt: string;
  student_response: string | null;
  emotional_snapshot: string | null;
  created_at: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  lesson_completion: "After",
  return_from_absence: "Welcome back",
  weekly_review: "Weekly reflection",
};

/** Map emotion to background wash + border + dot color */
const MOOD_STYLES: Record<string, { wash: string; border: string; dot: string }> = {
  engaged:    { wash: "bg-[#F0FDFA]", border: "border-l-[#0D9488]", dot: "bg-[#0D9488]" },
  frustrated: { wash: "bg-[#FFFBEB]", border: "border-l-[#F59E0B]", dot: "bg-[#F59E0B]" },
  anxious:    { wash: "bg-[#FFFBEB]", border: "border-l-[#FBBF24]", dot: "bg-[#FBBF24]" },
  deflated:   { wash: "bg-[#F9FAFB]", border: "border-l-[#D1D5DB]", dot: "bg-[#9CA3AF]" },
  manic:      { wash: "bg-[#EFF6FF]", border: "border-l-[#3B82F6]", dot: "bg-[#3B82F6]" },
  flat:       { wash: "bg-[#F9FAFB]", border: "border-l-[#E5E7EB]", dot: "bg-[#E5E7EB]" },
};

// Return-from-absence gets a distinct indigo treatment
const RETURN_STYLE = { wash: "bg-[#EEF2FF]", border: "border-l-[#6366F1]", dot: "bg-[#6366F1]" };
const SKIP_STYLE = { wash: "", border: "", dot: "bg-[#E5E7EB]" };

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

/** Look up lesson title by sequence index (1-based). */
function getLessonTitle(lessonId: number | null): string | null {
  if (lessonId == null) return null;
  // lesson_id stored in founder_log_entries is the 1-based sequence index
  const plan = LESSON_PLANS[lessonId - 1];
  return plan?.title ?? null;
}

export default function FoundersLogCard({ entry }: { entry: FoundersLogEntry }) {
  const isReturn = entry.trigger_type === "return_from_absence";
  const isWeekly = entry.trigger_type === "weekly_review";
  const isSkip = !entry.student_response;
  const lessonTitle = getLessonTitle(entry.lesson_id);

  // Pick style
  const mood = isSkip
    ? SKIP_STYLE
    : isReturn
    ? RETURN_STYLE
    : MOOD_STYLES[entry.emotional_snapshot ?? "engaged"] ?? MOOD_STYLES.engaged;

  // Date label
  let dateLabel = formatDate(entry.created_at);
  if (isReturn) {
    dateLabel += " \u00B7 Welcome back";
  } else if (isWeekly) {
    // no suffix needed, has its own label
  } else if (lessonTitle) {
    dateLabel += ` \u00B7 After \u201C${lessonTitle}\u201D`;
  }

  return (
    <article className="relative pb-10 last:pb-0">
      {/* Timeline dot */}
      <div
        className={`absolute -left-[28px] top-[3px] w-3 h-3 rounded-full border-2 border-white ${mood.dot}`}
        style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.06)" }}
        aria-hidden="true"
      />

      {/* Date */}
      <p className="text-[12px] font-medium text-[#9CA3AF] tracking-[0.01em] mb-2">
        {dateLabel}
      </p>

      {/* Weekly review label */}
      {isWeekly && (
        <p className="font-[family-name:var(--font-display)] text-[13px] font-semibold uppercase tracking-[0.06em] text-[#0D9488] mb-1.5">
          Weekly reflection
        </p>
      )}

      {/* Mirror prompt */}
      <p className="text-[15px] italic text-[#9CA3AF] leading-relaxed mb-2.5">
        {entry.mirror_prompt}
      </p>

      {/* Student response with color wash, or skip indicator */}
      {entry.student_response ? (
        <div
          className={`text-[16px] text-[#111827] leading-[1.7] p-[18px_22px] rounded-lg border-l-[3px] ${mood.wash} ${mood.border}`}
        >
          {entry.student_response}
        </div>
      ) : (
        <p className="text-[14px] text-[#D1D5DB] italic py-2">
          You decided to skip this one
        </p>
      )}
    </article>
  );
}

export type { FoundersLogEntry };
