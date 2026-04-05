"use server";

import { createClient } from "@/lib/supabase/server";

interface InterviewMessage {
  role: string;
  content: string;
}

export async function saveInterviewData(
  progressId: string,
  interviews: Record<string, InterviewMessage[]>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Fetch current artifacts
  const { data: progress } = await supabase
    .from("student_progress")
    .select("artifacts")
    .eq("id", progressId)
    .eq("student_id", user.id)
    .single();

  if (!progress) return { success: false, error: "Progress not found" };

  const artifacts = (progress.artifacts ?? {}) as Record<string, unknown>;

  // Save interview transcripts into artifacts
  const { error } = await supabase
    .from("student_progress")
    .update({
      artifacts: {
        ...artifacts,
        interview_data: interviews,
      },
    })
    .eq("id", progressId)
    .eq("student_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
