"use server";

import { createClient } from "@/lib/supabase/server";

export async function acknowledgeAlert(alertId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Verify instructor role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "instructor" && profile.role !== "org_admin")) {
    return { error: "Not authorized" };
  }

  // Acknowledge the alert (RLS ensures instructor can only see their class alerts)
  const { error } = await supabase
    .from("teacher_alerts")
    .update({ acknowledged: true })
    .eq("id", alertId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function acknowledgeAllAlerts(classId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Role check — only instructors and admins can acknowledge alerts
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || ((profile as { role: string }).role !== "instructor" && (profile as { role: string }).role !== "org_admin")) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("teacher_alerts")
    .update({ acknowledged: true })
    .eq("class_id", classId)
    .eq("acknowledged", false);

  if (error) return { error: error.message };
  return { success: true };
}

export async function resolveAlert(alertId: string, resolution?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "instructor" && profile.role !== "org_admin")) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("teacher_alerts")
    .update({
      acknowledged: true,
      context: {
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        resolution: resolution || null,
      },
    })
    .eq("id", alertId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function createClass(
  name: string,
  grades: number[],
  description?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "instructor" && profile.role !== "org_admin")) {
    return { error: "Not authorized" };
  }

  if (!profile.org_id) {
    return { error: "You must belong to an organization to create a class." };
  }

  // Create the class
  const { data: newClass, error: classError } = await supabase
    .from("classes")
    .insert({
      org_id: profile.org_id,
      instructor_id: user.id,
      name,
      description: description || null,
    })
    .select("id")
    .single();

  if (classError || !newClass) {
    return { error: classError?.message ?? "Failed to create class" };
  }

  // Generate invite code (6-char uppercase alphanumeric)
  const code = generateInviteCode();

  const { error: inviteError } = await supabase.from("invite_codes").insert({
    code,
    class_id: newClass.id,
    created_by: user.id,
  });

  if (inviteError) {
    return { error: inviteError.message };
  }

  return { success: true, classId: newClass.id, inviteCode: code };
}

export async function sendMessage(
  classId: string,
  studentId: string | null,
  message: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "instructor" && profile.role !== "org_admin")) {
    return { error: "Not authorized" };
  }

  // Content moderation on teacher messages (defense-in-depth)
  const { moderateContent } = await import("@/lib/content-moderation");
  const modResult = moderateContent(message);
  if (!modResult.safe) {
    return { error: "Message contains content that cannot be sent to students." };
  }

  // Store message using teacher_alerts with alert_type='teacher_message'
  // For announcements (studentId=null), we store one record per student in the class
  if (studentId) {
    const { error } = await supabase.from("teacher_alerts").insert({
      class_id: classId,
      student_id: studentId,
      alert_type: "teacher_message" as string,
      severity: "info",
      message,
      context: {
        sender_id: user.id,
        sent_at: new Date().toISOString(),
        type: "direct_message",
      },
      acknowledged: false,
    });

    if (error) return { error: error.message };
  } else {
    // Announcement: get all students in class
    const { data: enrollments } = await supabase
      .from("class_enrollments")
      .select("student_id")
      .eq("class_id", classId);

    if (enrollments && enrollments.length > 0) {
      const records = enrollments.map((e) => ({
        class_id: classId,
        student_id: e.student_id,
        alert_type: "teacher_message" as string,
        severity: "info" as const,
        message,
        context: {
          sender_id: user.id,
          sent_at: new Date().toISOString(),
          type: "announcement",
        },
        acknowledged: false,
      }));

      const { error } = await supabase.from("teacher_alerts").insert(records);
      if (error) return { error: error.message };
    }
  }

  return { success: true };
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I/O/0/1 for readability
  const randomBytes = new Uint8Array(6);
  crypto.getRandomValues(randomBytes);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}
