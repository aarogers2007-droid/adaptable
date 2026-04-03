"use server";

import { createClient } from "@/lib/supabase/server";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase: null, userId: null, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "org_admin") {
    return { supabase: null, userId: null, error: "Not an admin" };
  }

  return { supabase, userId: user.id, error: null };
}

export async function resetAllProgress() {
  const { supabase, userId, error } = await verifyAdmin();
  if (error || !supabase || !userId) return { error: error ?? "Auth failed" };

  await supabase
    .from("student_progress")
    .delete()
    .eq("student_id", userId);

  return { success: true };
}

export async function resetIkigai() {
  const { supabase, userId, error } = await verifyAdmin();
  if (error || !supabase || !userId) return { error: error ?? "Auth failed" };

  // Clear business idea, ikigai, draft, recommendations, and all progress
  await supabase
    .from("profiles")
    .update({
      business_idea: null,
      ikigai_result: null,
      ikigai_draft: null,
      niche_recommendations: null,
    })
    .eq("id", userId);

  await supabase
    .from("student_progress")
    .delete()
    .eq("student_id", userId);

  await supabase
    .from("ai_conversations")
    .delete()
    .eq("student_id", userId);

  await supabase
    .from("mentor_checkins")
    .delete()
    .eq("student_id", userId);

  return { success: true };
}

export async function resetSingleLesson(lessonId: string) {
  const { supabase, userId, error } = await verifyAdmin();
  if (error || !supabase || !userId) return { error: error ?? "Auth failed" };

  await supabase
    .from("student_progress")
    .delete()
    .eq("student_id", userId)
    .eq("lesson_id", lessonId);

  return { success: true };
}

export async function unlockAllLessons() {
  const { supabase, userId, error } = await verifyAdmin();
  if (error || !supabase || !userId) return { error: error ?? "Auth failed" };

  // Get all lessons
  const { data: lessons } = await supabase.from("lessons").select("id");

  if (!lessons) return { error: "No lessons found" };

  // For each lesson, create a progress record if it doesn't exist
  for (const lesson of lessons) {
    const { data: existing } = await supabase
      .from("student_progress")
      .select("id")
      .eq("student_id", userId)
      .eq("lesson_id", lesson.id)
      .single();

    if (!existing) {
      await supabase.from("student_progress").insert({
        student_id: userId,
        lesson_id: lesson.id,
        status: "in_progress",
      });
    }
  }

  return { success: true };
}
