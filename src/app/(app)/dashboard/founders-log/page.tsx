import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FoundersLogCard from "@/components/mirror/FoundersLogCard";
import MoodBar from "@/components/mirror/MoodBar";
import type { FoundersLogEntry } from "@/components/mirror/FoundersLogCard";
import Link from "next/link";

export const metadata = {
  title: "Your Founder's Log | Adaptable",
};

/** Count distinct calendar weeks (Mon-Sun, ISO 8601) that contain entries. */
function getWeekCount(entries: FoundersLogEntry[]): number {
  if (entries.length === 0) return 0;
  const weeks = new Set(
    entries.map((e) => {
      const d = new Date(e.created_at);
      // ISO week: get Monday of this week, use that as the week identifier
      const day = d.getUTCDay();
      const mondayOffset = day === 0 ? -6 : 1 - day; // Sunday → -6, else 1 - day
      const monday = new Date(d);
      monday.setUTCDate(monday.getUTCDate() + mondayOffset);
      return monday.toISOString().slice(0, 10); // YYYY-MM-DD of the Monday
    })
  );
  return weeks.size;
}

/** Build mood list from entries (chronological for the bar) */
function getMoodSequence(entries: FoundersLogEntry[]): (string | null)[] {
  // entries come in reverse chronological, reverse for the mood bar
  return [...entries]
    .reverse()
    .map((e) => {
      if (!e.student_response) return "skipped";
      if (e.trigger_type === "return_from_absence") return "returning";
      return e.emotional_snapshot ?? "engaged";
    });
}

export default async function FoundersLogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: entries, error } = await supabase
    .from("founder_log_entries")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-[640px] px-6 py-12">
        <h1
          className="font-[family-name:var(--font-display)] text-[28px] font-semibold text-[#111827] tracking-[-0.02em]"
        >
          Your Founder&apos;s Log
        </h1>
        <div className="mt-12 text-center">
          <p className="text-[16px] text-[#4B5563]">
            Something went wrong loading your reflections.
          </p>
          <Link href="/dashboard/founders-log" className="text-[#0D9488] text-sm mt-2 inline-block">
            Try again
          </Link>
        </div>
      </main>
    );
  }

  const typedEntries = (entries ?? []) as FoundersLogEntry[];
  const weekCount = getWeekCount(typedEntries);
  const moods = getMoodSequence(typedEntries);

  // Empty state
  if (typedEntries.length === 0) {
    return (
      <main className="mx-auto max-w-[640px] px-6 py-12">
        <h1
          className="font-[family-name:var(--font-display)] text-[28px] font-semibold text-[#111827] tracking-[-0.02em]"
        >
          Your Founder&apos;s Log
        </h1>
        <div className="pt-16 max-w-[420px]">
          <div className="w-10 h-[3px] bg-[#0D9488] rounded-sm mb-5" />
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-semibold text-[#111827] tracking-[-0.01em] mb-2.5">
            This page is yours
          </h2>
          <p className="text-[15px] text-[#4B5563] leading-[1.65] mb-6">
            Every time you finish a lesson, you&apos;ll get one question. Not a quiz. Just a question
            worth sitting with. Your answers build a record of who you&apos;re becoming as a founder.
          </p>
          <Link
            href="/lessons"
            className="inline-flex items-center min-h-[44px] px-6
              rounded-lg bg-[#0D9488] text-white text-[14px] font-medium
              hover:bg-[#14B8A6] active:bg-[#0F766E] transition-colors
              focus-visible:outline-2 focus-visible:outline-[#0D9488] focus-visible:outline-offset-2"
          >
            Back to your lesson
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[640px] px-6 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1
          className="font-[family-name:var(--font-display)] text-[28px] font-semibold text-[#111827] tracking-[-0.02em]"
        >
          Your Founder&apos;s Log
        </h1>
        <p className="text-[14px] text-[#9CA3AF] mt-1.5">
          {typedEntries.length} {typedEntries.length === 1 ? "reflection" : "reflections"} across {weekCount} {weekCount === 1 ? "week" : "weeks"}
        </p>

        {/* Mood journey bar */}
        {moods.length >= 2 && (
          <div className="mt-5">
            <MoodBar emotions={moods} />
          </div>
        )}
      </div>

      {/* Vertical timeline */}
      <div className="relative pl-7">
        {/* Continuous vertical line */}
        <div
          className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-[#F3F4F6] rounded-sm"
          aria-hidden="true"
        />

        {typedEntries.map((entry) => (
          <FoundersLogCard key={entry.id} entry={entry} />
        ))}
      </div>
    </main>
  );
}
