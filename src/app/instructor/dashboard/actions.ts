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

/**
 * Toggle whether streaks are shown to students in this class.
 * When false, students don't see fire emojis or streak counts on their dashboard.
 */
export async function setStreaksEnabled(classId: string, enabled: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "instructor" && profile.role !== "org_admin")) {
    return { error: "Not authorized" };
  }

  // Verify the instructor owns this class (or is org_admin)
  const { data: cls } = await supabase
    .from("classes")
    .select("instructor_id")
    .eq("id", classId)
    .single();
  if (!cls) return { error: "Class not found" };
  if (profile.role === "instructor" && cls.instructor_id !== user.id) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("classes")
    .update({ streaks_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("id", classId);

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Toggle whether the microphone/voice input UI is shown to students in this class.
 * When false, VoiceInput is hidden — students must type. Use this for districts
 * with microphone restrictions or classrooms where audio is disruptive.
 */
export async function setVoiceEnabled(classId: string, enabled: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "instructor" && profile.role !== "org_admin")) {
    return { error: "Not authorized" };
  }

  const { data: cls } = await supabase
    .from("classes")
    .select("instructor_id")
    .eq("id", classId)
    .single();
  if (!cls) return { error: "Class not found" };
  if (profile.role === "instructor" && cls.instructor_id !== user.id) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("classes")
    .update({ voice_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("id", classId);

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Export a CSV gradebook for an entire class.
 * Includes: student name, business name, lessons completed, total lessons,
 * % progress, last active, and any decisions/pitches captured.
 */
export async function exportGradebookCSV(classId: string): Promise<{ csv?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "instructor" && profile.role !== "org_admin")) {
    return { error: "Not authorized" };
  }

  // Verify class ownership
  const { data: cls } = await supabase
    .from("classes")
    .select("instructor_id, name")
    .eq("id", classId)
    .single();
  if (!cls) return { error: "Class not found" };
  if (profile.role === "instructor" && cls.instructor_id !== user.id) {
    return { error: "Not authorized" };
  }

  // Get enrolled students
  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("student_id, enrolled_at")
    .eq("class_id", classId);

  if (!enrollments || enrollments.length === 0) {
    return { csv: "Student Name,Business Name,Niche,Lessons Completed,Total Lessons,Progress %,Last Active,Pitch\n" };
  }

  const studentIds = enrollments.map((e) => e.student_id);

  // Batch fetch all needed data
  const [profilesRes, lessonsRes, progressRes, pitchesRes, activityRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, business_idea").in("id", studentIds),
    supabase.from("lessons").select("id"),
    supabase.from("student_progress").select("student_id, lesson_id, status, completed_at").in("student_id", studentIds),
    supabase.from("business_pitches").select("student_id, pitch_text").in("student_id", studentIds).order("created_at", { ascending: false }),
    supabase.from("ai_usage_log").select("student_id, created_at").in("student_id", studentIds).order("created_at", { ascending: false }),
  ]);

  const profiles = (profilesRes.data ?? []) as { id: string; full_name: string | null; business_idea: { name?: string; niche?: string } | null }[];
  const totalLessons = lessonsRes.data?.length ?? 0;
  const allProgress = progressRes.data ?? [];
  const allPitches = (pitchesRes.data ?? []) as { student_id: string; pitch_text: string }[];
  const allActivity = (activityRes.data ?? []) as { student_id: string; created_at: string }[];

  // Per-student aggregations
  const lastActiveMap = new Map<string, string>();
  for (const log of allActivity) {
    if (!lastActiveMap.has(log.student_id)) {
      lastActiveMap.set(log.student_id, log.created_at);
    }
  }

  const pitchMap = new Map<string, string>();
  for (const pitch of allPitches) {
    if (!pitchMap.has(pitch.student_id)) {
      pitchMap.set(pitch.student_id, pitch.pitch_text);
    }
  }

  // CSV helpers
  const escape = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows: string[] = [];
  rows.push([
    "Student Name", "Business Name", "Niche",
    "Lessons Completed", "Total Lessons", "Progress %",
    "Last Active", "Pitch",
  ].join(","));

  for (const p of profiles) {
    const completed = allProgress.filter((pr) => pr.student_id === p.id && pr.status === "completed").length;
    const pct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
    const lastActive = lastActiveMap.get(p.id);
    const lastActiveStr = lastActive ? new Date(lastActive).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never";
    const pitch = pitchMap.get(p.id) ?? "";

    rows.push([
      escape(p.full_name),
      escape(p.business_idea?.name),
      escape(p.business_idea?.niche),
      escape(completed),
      escape(totalLessons),
      escape(pct),
      escape(lastActiveStr),
      escape(pitch),
    ].join(","));
  }

  return { csv: rows.join("\n") };
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
  description?: string,
  sessionType?: "curriculum" | "invention"
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
      session_type: sessionType ?? "curriculum",
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

/**
 * Update per-org email sender configuration.
 * Only org_admins can change this. When set, crisis alert emails
 * are sent from the org's verified domain instead of the platform default.
 */
export async function updateOrgEmailConfig(
  orgId: string,
  senderEmail: string | null,
  senderDomain: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "org_admin") {
    return { error: "Only organization admins can change email settings." };
  }

  // Verify the user belongs to this org (unforgeable via profiles.org_id)
  if (profile.org_id !== orgId) {
    return { error: "Not authorized for this organization." };
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      sender_email: senderEmail || null,
      sender_domain: senderDomain || null,
    })
    .eq("id", orgId);

  if (error) return { error: error.message };
  return { success: true };
}

/**
 * Fetch the current org email config. Used by the settings UI.
 */
export async function getOrgEmailConfig(orgId: string) {
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

  if (profile.org_id !== orgId) {
    return { error: "Not authorized for this organization." };
  }

  const { data: org, error } = await supabase
    .from("organizations")
    .select("sender_email, sender_domain")
    .eq("id", orgId)
    .single();

  if (error) return { error: error.message };
  return {
    senderEmail: (org as Record<string, unknown>).sender_email as string | null,
    senderDomain: (org as Record<string, unknown>).sender_domain as string | null,
  };
}
