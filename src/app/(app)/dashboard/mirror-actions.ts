"use server";

import { createClient } from "@/lib/supabase/server";
import { generateMirrorPrompt, MIRROR_FALLBACK } from "@/lib/mirror";

/**
 * Generate a Mirror prompt for a return-from-absence trigger.
 * Called server-side from the dashboard when a 5+ day gap is detected.
 */
export async function generateAbsenceMirror(
  daysAbsent: number,
  businessName?: string,
): Promise<string> {
  try {
    return await generateMirrorPrompt({
      triggerType: "return_from_absence",
      daysAbsent,
      businessName,
    });
  } catch {
    return MIRROR_FALLBACK;
  }
}

/**
 * Generate a Mirror prompt for a weekly review trigger.
 */
export async function generateWeeklyMirror(
  activeDaysThisWeek: number,
  lessonsThisWeek: number,
  businessName?: string,
): Promise<string> {
  try {
    return await generateMirrorPrompt({
      triggerType: "weekly_review",
      activeDaysThisWeek,
      lessonsThisWeek,
      businessName,
    });
  } catch {
    return MIRROR_FALLBACK;
  }
}

/**
 * Check if a mirror trigger has already fired today for this trigger type.
 * Uses founder_log_entries as the server-side debounce mechanism.
 */
export async function hasMirrorFiredToday(
  triggerType: "lesson_completion" | "return_from_absence" | "weekly_review",
): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return true; // Safe default: don't show mirror if not authenticated

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("founder_log_entries")
    .select("id")
    .eq("student_id", user.id)
    .eq("trigger_type", triggerType)
    .gte("created_at", todayStart.toISOString())
    .limit(1);

  return (data?.length ?? 0) > 0;
}
