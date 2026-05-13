"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitRating(
  contextType: "lesson" | "scenario" | "guide",
  contextId: string | undefined,
  rating: number,
): Promise<{ success: boolean }> {
  try {
    if (!["lesson", "scenario", "guide"].includes(contextType)) return { success: false };
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) return { success: false };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    await supabase.from("lesson_ratings").insert({
      student_id: user.id,
      context_type: contextType,
      context_id: contextId ?? null,
      rating,
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}
