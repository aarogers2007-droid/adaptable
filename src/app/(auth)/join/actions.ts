"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Complete class enrollment after a new user has signed up.
 * Called from the onboarding page if sessionStorage has pending join data.
 */
export async function completeClassEnrollment(
  classId: string,
  orgId: string,
  inviteCode: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if already enrolled
  const { data: existing } = await supabase
    .from("class_enrollments")
    .select("id")
    .eq("class_id", classId)
    .eq("student_id", user.id)
    .single();

  if (existing) {
    return { success: true };
  }

  // Enroll
  const { error: enrollError } = await supabase
    .from("class_enrollments")
    .insert({ class_id: classId, student_id: user.id });

  if (enrollError) {
    return { error: "Failed to enroll in class" };
  }

  // Set org_id on profile
  await supabase
    .from("profiles")
    .update({ org_id: orgId })
    .eq("id", user.id);

  // Increment invite usage
  await supabase.rpc("increment_invite_usage", { invite_code: inviteCode });

  return { success: true };
}
