import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Assembles engagement context (check-ins, decisions, pitches) for AI system prompts.
 * Returns a formatted string block to inject into system prompts, or empty string if no data.
 */
export async function getEngagementContext(
  supabase: SupabaseClient,
  studentId: string
): Promise<string> {
  const [checkinsRes, pitchRes] = await Promise.all([
    supabase
      .from("daily_checkins")
      .select("prompt, response")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("business_pitches")
      .select("pitch_text")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const sections: string[] = [];

  // Check-ins
  const checkins = checkinsRes.data;
  if (checkins && checkins.length > 0) {
    const lines = checkins.map(
      (c: { prompt: string; response: string }) =>
        `- "${c.prompt}" → "${c.response}"`
    );
    sections.push(
      `RECENT CHECK-INS (the student's daily reflections — reference these to show you remember):\n${lines.join("\n")}`
    );
  }

  // Pitch
  const pitch = pitchRes.data;
  if (pitch && pitch.pitch_text) {
    sections.push(
      `BUSINESS PITCH (the student explaining their business in their own words — this is their authentic voice):\n"${pitch.pitch_text}"`
    );
  }

  return sections.join("\n\n");
}
