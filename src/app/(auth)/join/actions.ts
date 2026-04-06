"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Validate an invite code. Uses server-side client which bypasses RLS issues
 * for unauthenticated users on the join page.
 */
export async function validateInviteCode(code: string) {
  if (!code || typeof code !== "string" || code.trim().length < 4 || code.trim().length > 12) {
    return { error: "Invalid invite code. Check with your instructor." };
  }

  // Rate limit: max 20 invite validations per minute globally, max 5 per specific code
  // Reuses parent_pin_attempts table for persistent rate limiting
  const admin = createAdminClient();
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const codeHash = `inv_${code.trim().toUpperCase()}`;

  const { data: recentAttempts } = await admin
    .from("parent_pin_attempts")
    .select("id, token_hash")
    .like("token_hash", "inv_%")
    .gte("attempted_at", oneMinuteAgo);

  const globalCount = recentAttempts?.length ?? 0;
  const codeCount = recentAttempts?.filter(a => a.token_hash === codeHash).length ?? 0;

  if (globalCount >= 20 || codeCount >= 5) {
    return { error: "Too many attempts. Please wait a moment and try again." };
  }

  // Record this attempt
  await admin.from("parent_pin_attempts").insert({
    token_hash: codeHash,
    attempted_at: new Date().toISOString(),
  });

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

  // Re-validate the invite code server-side and verify classId matches
  const { data: codeData } = await supabase
    .from("invite_codes")
    .select("class_id, expires_at, current_uses, max_uses, classes(org_id)")
    .eq("code", inviteCode.trim().toUpperCase())
    .single();

  if (!codeData) {
    return { error: "Invalid invite code" };
  }
  const codeOrgId = (codeData.classes as unknown as { org_id: string } | null)?.org_id;
  if (codeData.class_id !== classId || (codeOrgId && codeOrgId !== orgId)) {
    return { error: "Invalid invite code for this class" };
  }
  if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
    return { error: "This code has expired" };
  }
  if (codeData.max_uses && codeData.current_uses >= codeData.max_uses) {
    return { error: "This code has reached its maximum uses" };
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

  // Atomic increment (returns false if max_uses exceeded)
  const { data: incremented } = await supabase.rpc("increment_invite_usage", {
    invite_code: inviteCode.trim().toUpperCase(),
  });

  if (incremented === false) {
    // Roll back enrollment since code is exhausted
    await supabase
      .from("class_enrollments")
      .delete()
      .eq("class_id", classId)
      .eq("student_id", user.id);
    return { error: "This invite code has reached its limit. Ask your instructor for a new one." };
  }

  return { success: true };
}
