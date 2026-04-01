"use server";

import { createClient } from "@/lib/supabase/server";

export async function markLessonComplete(progressId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("student_progress")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", progressId)
    .eq("student_id", user.id); // RLS double-check

  if (error) return { error: "Failed to update progress" };
  return { success: true };
}
