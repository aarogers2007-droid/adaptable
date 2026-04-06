"use server";

import { createClient } from "@/lib/supabase/server";

// ─── Shared: Role check helper ───

async function requireTeacher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase: null, user: null, error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || ((profile as { role: string }).role !== "instructor" && (profile as { role: string }).role !== "org_admin")) {
    return { supabase: null, user: null, error: "Not authorized" };
  }

  return { supabase, user, error: null };
}

// ─── Intervention Log ───

export async function logIntervention(
  studentId: string,
  classId: string,
  actionType: string,
  details?: Record<string, unknown>
) {
  const { supabase, user, error } = await requireTeacher();
  if (error || !supabase || !user) return { error };

  await supabase.from("intervention_log").insert({
    teacher_id: user.id,
    student_id: studentId,
    class_id: classId,
    action_type: actionType,
    details: details ?? null,
  });

  return { success: true };
}

export async function getStudentInterventions(studentId: string, classId: string) {
  const { supabase, error } = await requireTeacher();
  if (error || !supabase) return [];

  const { data } = await supabase
    .from("intervention_log")
    .select("*")
    .eq("student_id", studentId)
    .eq("class_id", classId)
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

// ─── Artifact Comments ───

export async function addComment(
  studentId: string,
  classId: string,
  artifactType: string,
  artifactId: string,
  commentText: string
) {
  const { supabase, user, error } = await requireTeacher();
  if (error || !supabase || !user) return { error };

  if (!commentText.trim()) return { error: "Comment cannot be empty" };
  if (commentText.length > 1000) return { error: "Comment too long" };

  // Content moderation on teacher comments
  const { moderateContent } = await import("@/lib/content-moderation");
  const modResult = moderateContent(commentText.trim());
  if (!modResult.safe) return { error: "Comment contains content that cannot be sent to students." };

  const { error: insertErr } = await supabase.from("teacher_comments").insert({
    teacher_id: user.id,
    student_id: studentId,
    class_id: classId,
    artifact_type: artifactType,
    artifact_id: artifactId,
    comment_text: commentText.trim(),
  });

  if (insertErr) return { error: insertErr.message };

  // Log the intervention
  await supabase.from("intervention_log").insert({
    teacher_id: user.id,
    student_id: studentId,
    class_id: classId,
    action_type: "comment_left",
    details: { artifact_type: artifactType, artifact_id: artifactId, comment_preview: commentText.trim().slice(0, 100) },
  });

  return { success: true };
}

export async function getStudentComments(studentId: string) {
  const { supabase, error } = await requireTeacher();
  if (error || !supabase) return [];

  const { data } = await supabase
    .from("teacher_comments")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function deleteComment(commentId: string) {
  const { supabase, user, error } = await requireTeacher();
  if (error || !supabase || !user) return { error };

  const { error: delErr } = await supabase
    .from("teacher_comments")
    .delete()
    .eq("id", commentId)
    .eq("teacher_id", user.id);

  if (delErr) return { error: delErr.message };
  return { success: true };
}

// ─── Student-facing: get my comments ───

export async function getMyComments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("teacher_comments")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

// ─── Follow-up Flags ───

export async function createFlag(
  studentId: string,
  classId: string,
  priority: "high" | "medium" | "low",
  note: string,
  dueDate?: string
) {
  const { supabase, user, error } = await requireTeacher();
  if (error || !supabase || !user) return { error };

  const { error: insertErr } = await supabase.from("teacher_flags").insert({
    teacher_id: user.id,
    student_id: studentId,
    class_id: classId,
    priority,
    note: note?.trim() || null,
    due_date: dueDate || null,
  });

  if (insertErr) return { error: insertErr.message };

  // Log the intervention
  await supabase.from("intervention_log").insert({
    teacher_id: user.id,
    student_id: studentId,
    class_id: classId,
    action_type: "flag_set",
    details: { priority, note: note?.trim()?.slice(0, 100), due_date: dueDate },
  });

  return { success: true };
}

export async function resolveFlag(flagId: string) {
  const { supabase, user, error } = await requireTeacher();
  if (error || !supabase || !user) return { error };

  const { data: flag } = await supabase
    .from("teacher_flags")
    .select("student_id, class_id")
    .eq("id", flagId)
    .single();

  const { error: updateErr } = await supabase
    .from("teacher_flags")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", flagId)
    .eq("teacher_id", user.id);

  if (updateErr) return { error: updateErr.message };

  if (flag) {
    await supabase.from("intervention_log").insert({
      teacher_id: user.id,
      student_id: flag.student_id,
      class_id: flag.class_id,
      action_type: "flag_resolved",
      details: { flag_id: flagId },
    });
  }

  return { success: true };
}

export async function getClassFlags(classId: string) {
  const { supabase, error } = await requireTeacher();
  if (error || !supabase) return [];

  const { data } = await supabase
    .from("teacher_flags")
    .select("*, profiles!teacher_flags_student_id_fkey(full_name, business_idea)")
    .eq("class_id", classId)
    .eq("resolved", false)
    .order("priority")
    .order("due_date", { ascending: true, nullsFirst: false });

  return data ?? [];
}

// ─── Smart Nudge Templates ───
// Note: getNudgeTemplates is a pure function, moved to NudgeTemplates.tsx (client component)
// because server action files can only export async functions.

// ─── Send Nudge (message + log) ───

export async function sendNudge(
  studentId: string,
  classId: string,
  message: string,
  templateUsed?: string
) {
  const { supabase, user, error } = await requireTeacher();
  if (error || !supabase || !user) return { error };

  // Content moderation on nudge messages
  const { moderateContent } = await import("@/lib/content-moderation");
  const modResult = moderateContent(message);
  if (!modResult.safe) return { error: "Message contains content that cannot be sent to students." };

  // Insert as a teacher alert/message (reusing existing pattern)
  await supabase.from("teacher_alerts").insert({
    class_id: classId,
    student_id: studentId,
    alert_type: "teacher_message",
    severity: "info",
    message,
    context: { from_teacher: true, template_used: templateUsed },
    acknowledged: false,
  });

  // Log the intervention
  await supabase.from("intervention_log").insert({
    teacher_id: user.id,
    student_id: studentId,
    class_id: classId,
    action_type: templateUsed ? "nudge_sent" : "message_sent",
    details: { message_preview: message.slice(0, 100), template_used: templateUsed },
  });

  return { success: true };
}
