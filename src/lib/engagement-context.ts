import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Assembles engagement context (check-ins, decisions, pitches) for AI system prompts.
 * Returns a formatted string block to inject into system prompts, or empty string if no data.
 */
export async function getEngagementContext(
  supabase: SupabaseClient,
  studentId: string
): Promise<string> {
  const [checkinsRes, decisionsRes, pitchRes] = await Promise.all([
    supabase
      .from("daily_checkins")
      .select("prompt, response")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("lesson_decisions")
      .select("decision_text, lessons(title, lesson_sequence)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(5),
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

  // Decisions
  const decisions = decisionsRes.data;
  if (decisions && decisions.length > 0) {
    const lines = decisions.map(
      (d: Record<string, unknown>) => {
        const lessons = d.lessons as { title: string; lesson_sequence: number }[] | { title: string; lesson_sequence: number } | null;
        const lesson = Array.isArray(lessons) ? lessons[0] : lessons;
        const label = lesson
          ? `Lesson ${lesson.lesson_sequence}`
          : "Lesson";
        return `- ${label}: "${d.decision_text}"`;
      }
    );
    sections.push(
      `LESSON DECISIONS (key choices the student made — check for contradictions, reference naturally):\n${lines.join("\n")}`
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
