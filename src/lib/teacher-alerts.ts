import { type SupabaseClient } from "@supabase/supabase-js";
import type { AlertType, AlertSeverity } from "@/lib/types";

/**
 * Teacher alert generation.
 *
 * Alerts are created by:
 * 1. Content moderation flags (inline, from chat routes)
 * 2. Emotional pattern detection (inline, from lesson-chat)
 * 3. Inactivity/stuck detection (on-demand, when instructor loads dashboard)
 *
 * No cron jobs. Alert checks run when the instructor views the dashboard
 * or when a flag event fires during a student interaction.
 */

interface CreateAlertParams {
  supabase: SupabaseClient;
  studentId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * Create a teacher alert. Finds the student's class and creates
 * the alert for the instructor to see.
 *
 * Deduplication: won't create a duplicate if an unacknowledged alert
 * of the same type exists for the same student within the last 24h.
 */
export async function createAlert({
  supabase,
  studentId,
  alertType,
  severity,
  message,
  context,
}: CreateAlertParams) {
  // Find the student's class
  const { data: enrollment } = await supabase
    .from("class_enrollments")
    .select("class_id")
    .eq("student_id", studentId)
    .limit(1)
    .single();

  if (!enrollment) return; // Student not in a class, no instructor to alert

  // Deduplicate: check for recent unacknowledged alert of same type
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("teacher_alerts")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("class_id", enrollment.class_id)
    .eq("alert_type", alertType)
    .eq("acknowledged", false)
    .gte("created_at", oneDayAgo);

  if ((count ?? 0) > 0) return; // Already alerted

  await supabase.from("teacher_alerts").insert({
    class_id: enrollment.class_id,
    student_id: studentId,
    alert_type: alertType,
    severity,
    message,
    context: context ?? null,
    acknowledged: false,
  });
}

/**
 * Fire a content moderation alert. Called from chat routes when
 * moderateContent() returns safe:false.
 */
export async function alertContentFlag(
  supabase: SupabaseClient,
  studentId: string,
  flaggedText: string,
  moderationType: string,
  feature: string,
) {
  await createAlert({
    supabase,
    studentId,
    alertType: "content_flag",
    severity: moderationType === "profanity" ? "urgent" : "warning",
    message: `Student triggered content filter (${moderationType}) in ${feature}.`,
    context: {
      flagged_text: flaggedText.slice(0, 200),
      moderation_type: moderationType,
      feature,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Fire a CRITICAL crisis alert. Called from lesson-chat when
 * crisis-detection identifies a self-harm/suicidal/abuse signal.
 *
 * Bypasses deduplication — every crisis signal creates an alert.
 * Writes the distinct alert_type='crisis' with structured audit fields.
 *
 * Returns { alertId, classId, instructorId } so the caller can fire the
 * real-time notification path (email/SMS) and update notified_at on success.
 */
export async function alertCrisis(
  supabase: SupabaseClient,
  studentId: string,
  crisisType: string,
  matchedText: string,
  flaggedMessage: string,
  feature: string,
): Promise<{ alertId: string; classId: string; instructorId: string | null } | null> {
  // Find the student's class + instructor in one query
  const { data: enrollment } = await supabase
    .from("class_enrollments")
    .select("class_id, classes(instructor_id)")
    .eq("student_id", studentId)
    .limit(1)
    .single<{ class_id: string; classes: { instructor_id: string } | null }>();

  if (!enrollment) return null;

  const classId = enrollment.class_id;
  const instructorId = enrollment.classes?.instructor_id ?? null;

  // Insert without deduplication — every crisis signal must surface
  const { data: inserted, error } = await supabase
    .from("teacher_alerts")
    .insert({
      class_id: classId,
      student_id: studentId,
      alert_type: "crisis",
      severity: "urgent",
      message: `URGENT: Student may be in crisis. Type: ${crisisType}. Please check in immediately.`,
      context: {
        crisis_type: crisisType,
        matched_phrase: matchedText.slice(0, 100),
        surrounding_message: flaggedMessage.slice(0, 500),
        feature,
        timestamp: new Date().toISOString(),
        requires_immediate_attention: true,
      },
      crisis_type: crisisType,
      severity_at_creation: "urgent",
      acknowledged: false,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !inserted) {
    console.error("[alertCrisis] failed to insert alert", error);
    return null;
  }

  return { alertId: inserted.id, classId, instructorId };
}

/**
 * Fire an emotional concern alert. Called from lesson-chat when
 * the AI detects sustained negative emotional states.
 *
 * Only alerts after 3+ emotional signals in engagement_notes
 * (accumulated across lessons, not just one response).
 */
export async function alertEmotionalConcern(
  supabase: SupabaseClient,
  studentId: string,
  emotion: string,
  engagementNotes: string[],
  lessonTitle: string,
) {
  // Count negative signals in recent engagement notes
  const negativeEmotions = ["frustrated", "anxious", "deflated", "flat"];
  const recentNegative = engagementNotes.filter((note) =>
    negativeEmotions.some((e) => note.includes(e))
  );

  // Only alert after 3+ accumulated signals
  if (recentNegative.length < 3) return;

  const severity: AlertSeverity =
    emotion === "deflated" ? "urgent" : "warning";

  await createAlert({
    supabase,
    studentId,
    alertType: "emotional",
    severity,
    message: `Student showing sustained ${emotion} pattern across ${recentNegative.length} interactions.`,
    context: {
      current_emotion: emotion,
      pattern: recentNegative.slice(-5),
      current_lesson: lessonTitle,
    },
  });
}

/**
 * Check for inactive and stuck students. Called on-demand when
 * the instructor loads their dashboard.
 *
 * Inactive: no ai_usage_log entries in 3+ days
 * Stuck: same lesson in_progress for 3+ days with no new conversation
 */
export async function checkInactiveAndStuck(
  supabase: SupabaseClient,
  classId: string,
) {
  // Get enrolled students
  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("student_id")
    .eq("class_id", classId);

  if (!enrollments || enrollments.length === 0) return;

  const studentIds = enrollments.map((e) => e.student_id);
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  // Batch: get all recent activity and all progress in 3 queries (not N+1)
  const [recentActivityRes, allProgressRes, stuckProgressRes, lessonsRes] = await Promise.all([
    supabase
      .from("ai_usage_log")
      .select("student_id")
      .in("student_id", studentIds)
      .gte("created_at", threeDaysAgo),
    supabase
      .from("student_progress")
      .select("student_id")
      .in("student_id", studentIds),
    supabase
      .from("student_progress")
      .select("student_id, lesson_id, updated_at")
      .in("student_id", studentIds)
      .eq("status", "in_progress")
      .lt("updated_at", threeDaysAgo),
    supabase
      .from("lessons")
      .select("id, title"),
  ]);

  // Build lookup sets
  const activeStudents = new Set(
    (recentActivityRes.data ?? []).map((r) => r.student_id)
  );
  const studentsWithProgress = new Set(
    (allProgressRes.data ?? []).map((p) => p.student_id)
  );
  const lessonTitleMap = new Map(
    (lessonsRes.data ?? []).map((l) => [l.id, l.title as string])
  );

  // Check inactive students (no recent activity but has progress)
  const alertPromises: Promise<void>[] = [];

  for (const studentId of studentIds) {
    if (!activeStudents.has(studentId) && studentsWithProgress.has(studentId)) {
      alertPromises.push(
        createAlert({
          supabase,
          studentId,
          alertType: "inactive",
          severity: "info",
          message: "Student hasn't been active in 3+ days.",
          context: { last_checked: new Date().toISOString() },
        })
      );
    }
  }

  // Check stuck students
  for (const sp of stuckProgressRes.data ?? []) {
    const title = lessonTitleMap.get(sp.lesson_id) ?? "a lesson";
    alertPromises.push(
      createAlert({
        supabase,
        studentId: sp.student_id,
        alertType: "stuck",
        severity: "warning",
        message: `Student stuck on "${title}" for 3+ days.`,
        context: {
          lesson_id: sp.lesson_id,
          lesson_title: title,
          last_activity: sp.updated_at,
        },
      })
    );
  }

  await Promise.all(alertPromises);
}

/**
 * Detect module-level struggle patterns. Called on-demand when
 * the instructor loads their dashboard.
 *
 * If 30%+ of enrolled students are stuck on the same lesson
 * (status "in_progress" with no update in 3+ days), creates a
 * class-wide alert so the instructor can address it.
 */
export async function checkClassStrugglePatterns(
  supabase: SupabaseClient,
  classId: string,
  studentIds: string[],
) {
  if (studentIds.length === 0) return;

  const threeDaysAgo = new Date(
    Date.now() - 3 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Batch: fetch all in_progress rows that are stale + lesson titles in parallel
  const [stuckRes, lessonsRes] = await Promise.all([
    supabase
      .from("student_progress")
      .select("student_id, lesson_id")
      .in("student_id", studentIds)
      .eq("status", "in_progress")
      .lt("updated_at", threeDaysAgo),
    supabase.from("lessons").select("id, title"),
  ]);

  const stuckRows = stuckRes.data ?? [];
  if (stuckRows.length === 0) return;

  const lessonTitleMap = new Map(
    (lessonsRes.data ?? []).map((l) => [l.id, l.title as string])
  );

  // Group stuck students by lesson_id
  const stuckByLesson = new Map<string, string[]>();
  for (const row of stuckRows) {
    const list = stuckByLesson.get(row.lesson_id) ?? [];
    list.push(row.student_id);
    stuckByLesson.set(row.lesson_id, list);
  }

  const totalStudents = studentIds.length;
  const threshold = 0.3; // 30%

  const alertPromises: Promise<void>[] = [];

  for (const [lessonId, stuckStudentIds] of stuckByLesson) {
    const stuckCount = stuckStudentIds.length;
    const percentage = Math.round((stuckCount / totalStudents) * 100);

    if (stuckCount / totalStudents >= threshold) {
      const lessonTitle = lessonTitleMap.get(lessonId) ?? "a lesson";

      // Use first stuck student as the student_id (createAlert requires one)
      alertPromises.push(
        createAlert({
          supabase,
          studentId: stuckStudentIds[0],
          alertType: "stuck",
          severity: "warning",
          message: `${percentage}% of your class is stuck on "${lessonTitle}". Consider addressing this in class.`,
          context: {
            type: "class_struggle",
            lesson_id: lessonId,
            lesson_title: lessonTitle,
            stuck_count: stuckCount,
            total_students: totalStudents,
            percentage,
          },
        })
      );
    }
  }

  await Promise.all(alertPromises);
}
