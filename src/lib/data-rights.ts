"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Data export and deletion server actions for FERPA/COPPA compliance.
 *
 * Supports:
 *   - Student exports their own full record
 *   - Student requests deletion of their own account (30-day grace)
 *   - Student cancels a pending deletion request (within the grace period)
 *   - Org admin exports any student in their org
 *   - Org admin requests deletion for any student in their org
 *
 * Every action is logged to data_access_log with requester id, role, and timestamp.
 *
 * Parental access (via PIN) is intentionally NOT wired here yet — that needs the
 * parental consent flow in #2 (COPPA scaffolding) to land first so we know what
 * "verified parent" means.
 */

interface ExportResult {
  json?: string;
  filename?: string;
  error?: string;
}

/**
 * Export the full record of a student's data as JSON.
 * Returns a JSON string the caller can download.
 */
export async function exportStudentData(targetStudentId: string): Promise<ExportResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Authorization check
  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("role, org_id")
    .eq("id", user.id)
    .single();
  if (!requesterProfile) return { error: "Profile not found" };

  const isSelfRequest = user.id === targetStudentId;
  const isOrgAdmin = requesterProfile.role === "org_admin";

  if (!isSelfRequest && !isOrgAdmin) {
    return { error: "Not authorized to export this student's data" };
  }

  // If org_admin, verify the target student is in the admin's org
  if (isOrgAdmin && !isSelfRequest) {
    const { data: enrollment } = await supabase
      .from("class_enrollments")
      .select("classes(org_id)")
      .eq("student_id", targetStudentId)
      .limit(1)
      .single<{ classes: { org_id: string } | null }>();
    if (!enrollment?.classes?.org_id || enrollment.classes.org_id !== requesterProfile.org_id) {
      return { error: "Student not in your organization" };
    }
  }

  // Pull the full student record
  const [
    profileRes,
    progressRes,
    conversationsRes,
    checkinsRes,
    usageRes,
    alertsRes,
    enrollmentsRes,
    achievementsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", targetStudentId).single(),
    supabase.from("student_progress").select("*").eq("student_id", targetStudentId),
    supabase.from("ai_conversations").select("*").eq("student_id", targetStudentId),
    supabase.from("mentor_checkins").select("*").eq("student_id", targetStudentId),
    supabase.from("ai_usage_log").select("*").eq("student_id", targetStudentId),
    supabase.from("teacher_alerts").select("*").eq("student_id", targetStudentId),
    supabase.from("class_enrollments").select("*, classes(name, id)").eq("student_id", targetStudentId),
    // achievements table may or may not exist depending on your schema
    supabase.from("student_achievements").select("*").eq("student_id", targetStudentId).then(
      (r) => r,
      () => ({ data: null, error: null })
    ),
  ]);

  const exportPayload = {
    export_version: 1,
    exported_at: new Date().toISOString(),
    exported_by: user.id,
    requester_role: isSelfRequest ? "student" : requesterProfile.role,
    student: profileRes.data,
    progress: progressRes.data,
    conversations: conversationsRes.data,
    mentor_checkins: checkinsRes.data,
    ai_usage_log: usageRes.data,
    teacher_alerts: alertsRes.data,
    enrollments: enrollmentsRes.data,
    achievements: achievementsRes.data,
  };

  // Audit log
  await supabase.from("data_access_log").insert({
    student_id: targetStudentId,
    requester_id: user.id,
    requester_role: isSelfRequest ? "student" : "org_admin",
    action: "export",
    details: { export_version: 1 },
  });

  const filename = `adaptable_${targetStudentId.slice(0, 8)}_${new Date().toISOString().split("T")[0]}.json`;
  return { json: JSON.stringify(exportPayload, null, 2), filename };
}

/**
 * Request deletion of a student's account. Sets a 30-day grace period during
 * which the request can be cancelled. After the grace period a server cron
 * (not yet implemented) hard-deletes the row, which cascades.
 */
export async function requestDeletion(targetStudentId: string, reason?: string): Promise<{ requestId?: string; scheduledFor?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("role, org_id")
    .eq("id", user.id)
    .single();
  if (!requesterProfile) return { error: "Profile not found" };

  const isSelfRequest = user.id === targetStudentId;
  const isOrgAdmin = requesterProfile.role === "org_admin";

  if (!isSelfRequest && !isOrgAdmin) {
    return { error: "Not authorized to request deletion of this account" };
  }

  if (isOrgAdmin && !isSelfRequest) {
    const { data: enrollment } = await supabase
      .from("class_enrollments")
      .select("classes(org_id)")
      .eq("student_id", targetStudentId)
      .limit(1)
      .single<{ classes: { org_id: string } | null }>();
    if (!enrollment?.classes?.org_id || enrollment.classes.org_id !== requesterProfile.org_id) {
      return { error: "Student not in your organization" };
    }
  }

  // Check for an existing pending request
  const { data: existing } = await supabase
    .from("deletion_requests")
    .select("id, scheduled_for")
    .eq("student_id", targetStudentId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return { requestId: existing.id, scheduledFor: existing.scheduled_for };
  }

  const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: inserted, error } = await supabase
    .from("deletion_requests")
    .insert({
      student_id: targetStudentId,
      requested_by: user.id,
      requester_role: isSelfRequest ? "student" : "org_admin",
      reason: reason ?? null,
      scheduled_for: scheduledFor,
    })
    .select("id, scheduled_for")
    .single();

  if (error || !inserted) return { error: error?.message ?? "Failed to create deletion request" };

  // Mark profile soft-deleted (locks them out, but data is still recoverable)
  await supabase
    .from("profiles")
    .update({
      soft_deleted_at: new Date().toISOString(),
      deletion_scheduled_for: scheduledFor,
    })
    .eq("id", targetStudentId);

  // Audit log
  await supabase.from("data_access_log").insert({
    student_id: targetStudentId,
    requester_id: user.id,
    requester_role: isSelfRequest ? "student" : "org_admin",
    action: "deletion_requested",
    details: { request_id: inserted.id, scheduled_for: scheduledFor, reason: reason ?? null },
  });

  return { requestId: inserted.id, scheduledFor };
}

/**
 * Cancel a pending deletion request (only valid during the 30-day grace period).
 */
export async function cancelDeletion(requestId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: req } = await supabase
    .from("deletion_requests")
    .select("id, student_id, status, requested_by")
    .eq("id", requestId)
    .single();
  if (!req) return { error: "Deletion request not found" };
  if (req.status !== "pending") return { error: "This request is no longer pending" };

  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("role, org_id")
    .eq("id", user.id)
    .single();
  const isSelf = req.student_id === user.id;
  const isOrgAdmin = requesterProfile?.role === "org_admin";
  if (!isSelf && !isOrgAdmin) return { error: "Not authorized" };

  await supabase
    .from("deletion_requests")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
    })
    .eq("id", requestId);

  // Restore the profile
  await supabase
    .from("profiles")
    .update({
      soft_deleted_at: null,
      deletion_scheduled_for: null,
    })
    .eq("id", req.student_id);

  await supabase.from("data_access_log").insert({
    student_id: req.student_id,
    requester_id: user.id,
    requester_role: isSelf ? "student" : "org_admin",
    action: "deletion_cancelled",
    details: { request_id: requestId },
  });

  return { success: true };
}
