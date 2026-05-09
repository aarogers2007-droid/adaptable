"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Save the student's invention wizard progress. Called after each circle.
 * Creates the row on first call, upserts on subsequent calls.
 */
export async function saveInventionProgress(data: {
  circle_1_category?: string;
  idea_freetext?: string;
  circle_2_archetype?: string;
  circle_3_chips?: string[];
  circle_3_freetext?: string;
  circle_4_scale?: string;
  circle_5_voice?: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Find the student's invention class code
  const { data: enrollment } = await supabase
    .from("class_enrollments")
    .select("class_id, classes(session_type), classes!inner(invite_codes(code))")
    .eq("student_id", user.id)
    .limit(1)
    .single();

  if (!enrollment) return { error: "Not enrolled in a class" };

  // Get the invite code for this class
  const { data: inviteCode } = await supabase
    .from("invite_codes")
    .select("code")
    .eq("class_id", (enrollment as Record<string, unknown>).class_id as string)
    .limit(1)
    .single();

  if (!inviteCode) return { error: "No class code found" };
  const classCode = inviteCode.code;

  // ── Content moderation on free text inputs ──
  if (data.circle_3_freetext && data.circle_3_freetext.trim().length > 0) {
    const { moderateContent } = await import("@/lib/content-moderation");
    const check = moderateContent(data.circle_3_freetext);
    if (!check.safe) return { error: check.reason ?? "That content isn't appropriate. Try rephrasing." };

    // ML moderation (catches what regex misses)
    const { moderateContentML } = await import("@/lib/ml-moderation");
    const mlCheck = await moderateContentML(data.circle_3_freetext);
    if (!mlCheck.safe) return { error: "That content isn't appropriate. Try rephrasing." };

    // Universal crisis detection — regex + ML (non-blocking)
    const { detectCrisisUniversal } = await import("@/lib/crisis-detection");
    detectCrisisUniversal(data.circle_3_freetext).then(async (crisisCheck) => {
      if (!crisisCheck.detected) return;
      const { alertCrisis } = await import("@/lib/teacher-alerts");
      await alertCrisis(supabase, user.id, crisisCheck.type ?? "hopelessness", crisisCheck.matchedPattern ?? "", data.circle_3_freetext!, "invention-wizard");
    }).catch(() => {});
  }

  // Moderate idea_freetext if present (legacy field, may still be submitted)
  if (data.idea_freetext && data.idea_freetext.trim().length > 0) {
    const { moderateContent } = await import("@/lib/content-moderation");
    const check = moderateContent(data.idea_freetext);
    if (!check.safe) return { error: check.reason ?? "That content isn't appropriate. Try rephrasing." };

    const { moderateContentML } = await import("@/lib/ml-moderation");
    const mlCheck = await moderateContentML(data.idea_freetext);
    if (!mlCheck.safe) return { error: "That content isn't appropriate. Try rephrasing." };

    const { detectCrisisUniversal } = await import("@/lib/crisis-detection");
    detectCrisisUniversal(data.idea_freetext).then(async (crisisCheck) => {
      if (!crisisCheck.detected) return;
      const { alertCrisis } = await import("@/lib/teacher-alerts");
      await alertCrisis(supabase, user.id, crisisCheck.type ?? "hopelessness", crisisCheck.matchedPattern ?? "", data.idea_freetext!, "invention-wizard");
    }).catch(() => {});
  }

  // Upsert the invention session
  const { error: upsertError } = await supabase
    .from("invention_sessions")
    .upsert(
      {
        student_id: user.id,
        class_code: classCode,
        ...data,
      },
      { onConflict: "student_id,class_code" }
    );

  if (upsertError) {
    console.error("[invention] save progress failed:", upsertError);
    return { error: "Failed to save progress" };
  }

  return { success: true };
}

/**
 * Mark the invention session as complete after circle 5.
 * No AI synthesis — just stamps completed_at.
 */
export async function completeInventionSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: enrollment } = await supabase
    .from("class_enrollments")
    .select("class_id")
    .eq("student_id", user.id)
    .limit(1)
    .single();

  const { data: inviteCode } = await supabase
    .from("invite_codes")
    .select("code")
    .eq("class_id", enrollment?.class_id)
    .limit(1)
    .single();

  if (!inviteCode) return { error: "No class code found" };

  const { error } = await supabase
    .from("invention_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("student_id", user.id)
    .eq("class_code", inviteCode.code);

  if (error) {
    console.error("[invention] complete session failed:", error);
    return { error: "Failed to complete session" };
  }

  return { success: true };
}

/**
 * Load the student's current invention session (for resuming).
 */
export async function loadInventionSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: session } = await supabase
    .from("invention_sessions")
    .select("*")
    .eq("student_id", user.id)
    .limit(1)
    .single();

  return { session };
}

/**
 * Check if the student's group has been revealed.
 */
export async function getGroupAssignment() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: session } = await supabase
    .from("invention_sessions")
    .select("group_number, class_code")
    .eq("student_id", user.id)
    .limit(1)
    .single();

  if (!session || !session.group_number) {
    return { groupNumber: null, revealed: false };
  }

  const { data: inviteCode } = await supabase
    .from("invite_codes")
    .select("class_id, classes(grouping_config)")
    .eq("code", session.class_code)
    .limit(1)
    .single();

  const config = (inviteCode?.classes as unknown as { grouping_config: Record<string, unknown> } | undefined)?.grouping_config;
  const revealed = config?.groups_revealed === true;

  return {
    groupNumber: revealed ? session.group_number : null,
    revealed,
  };
}
