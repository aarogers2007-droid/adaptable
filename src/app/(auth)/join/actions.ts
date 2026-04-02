"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Validate an invite code. Uses server-side client which bypasses RLS issues
 * for unauthenticated users on the join page.
 */
export async function validateInviteCode(code: string) {
  const supabase = await createClient();

  const trimmed = code.trim().toUpperCase();

  const { data: invite, error } = await supabase
    .from("invite_codes")
    .select("id, code, class_id, expires_at, max_uses, current_uses, classes(name, org_id)")
    .eq("code", trimmed)
    .single();

  if (error || !invite) {
    return { error: "Invalid invite code. Check with your instructor." };
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { error: "This invite code has expired. Ask your instructor for a new one." };
  }

  if (invite.max_uses && invite.current_uses >= invite.max_uses) {
    return { error: "This invite code has reached its limit. Ask your instructor for a new one." };
  }

  const classData = invite.classes as unknown as { name: string; org_id: string };

  return {
    className: classData.name,
    classId: invite.class_id,
    orgId: classData.org_id,
  };
}

/**
 * Complete class enrollment after a user has signed up or is logged in.
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
  await supabase.rpc("increment_invite_usage", { invite_code: inviteCode.trim().toUpperCase() });

  return { success: true };
}
