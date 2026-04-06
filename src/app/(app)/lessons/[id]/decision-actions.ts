"use server";

import { createClient } from "@/lib/supabase/server";
import { moderateContent } from "@/lib/content-moderation";

export async function saveDecision(lessonId: string, decisionText: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Validate
  const trimmed = decisionText.trim();
  if (!trimmed) return { error: "Please write your decision." };
  if (trimmed.length > 500)
    return { error: "Keep it under 500 characters." };

  // Moderate
  const modResult = moderateContent(trimmed);
  if (!modResult.safe) return { error: modResult.reason };

  // Upsert (unique on student_id + lesson_id)
  const { error: upsertErr } = await supabase
    .from("lesson_decisions")
    .upsert(
      {
        student_id: user.id,
        lesson_id: lessonId,
        decision_text: trimmed,
      },
      { onConflict: "student_id,lesson_id" }
    );

  if (upsertErr) {
    console.error("Failed to save decision:", upsertErr);
    return { error: "Something went wrong. Try again." };
  }

  return { success: true };
}

export async function getDecisionForLesson(lessonId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("lesson_decisions")
    .select("*")
    .eq("student_id", user.id)
    .eq("lesson_id", lessonId)
    .single();

  return data;
}

export async function getStudentDecisions(studentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Students can only read their own decisions
  if (user.id !== studentId) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || (profile.role !== "instructor" && profile.role !== "org_admin")) {
      return [];
    }
  }

  const { data } = await supabase
    .from("lesson_decisions")
    .select("*, lessons(title, lesson_sequence)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
