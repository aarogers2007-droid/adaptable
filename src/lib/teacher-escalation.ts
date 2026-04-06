/**
 * Teacher Escalation System
 *
 * When alerts go unacknowledged for 48+ hours and the teacher hasn't
 * checked the dashboard, the platform takes action:
 * 1. Logs the escalation
 * 2. Provides fallback interventions (gentler AI tone, suppress leaderboard)
 * 3. In a production system, this would trigger email/push notifications
 *
 * This runs during dashboard page loads or can be called by a cron job.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface EscalationResult {
  studentsNeedingAttention: {
    studentId: string;
    studentName: string;
    alertType: string;
    alertAge: number; // hours
    suggestedAction: string;
  }[];
  teacherLastActive: string | null;
  escalationLevel: "none" | "reminder" | "urgent" | "critical";
}

/**
 * Check for unacknowledged alerts and determine escalation level.
 * Called from the instructor dashboard or a scheduled job.
 */
export async function checkEscalation(
  supabase: SupabaseClient,
  classId: string
): Promise<EscalationResult> {
  // Get unacknowledged alerts for this class
  const { data: alerts } = await supabase
    .from("teacher_alerts")
    .select("id, student_id, alert_type, severity, created_at, context")
    .eq("class_id", classId)
    .eq("acknowledged", false)
    .order("created_at", { ascending: true });

  if (!alerts || alerts.length === 0) {
    return { studentsNeedingAttention: [], teacherLastActive: null, escalationLevel: "none" };
  }

  const now = Date.now();
  const studentsNeedingAttention = alerts.map((alert) => {
    const ageMs = now - new Date(alert.created_at).getTime();
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60));

    let suggestedAction = "";
    switch (alert.alert_type) {
      case "emotional":
        suggestedAction = "Send an encouraging message. Consider: 'I see you're working through some tough stuff. Your work is strong. Take your time.'";
        break;
      case "stuck":
        suggestedAction = "Student has been on the same lesson for 3+ days. Try a specific hint or offer to discuss in person.";
        break;
      case "inactive":
        suggestedAction = "Student hasn't logged in for 3+ days. A quick 'thinking of you' message goes a long way.";
        break;
      case "content_flag":
        suggestedAction = "Content was flagged by moderation. Review the context and decide if a conversation is needed.";
        break;
      case "checkin_quality":
        suggestedAction = "Student's check-ins have been low-effort. Consider a 1-on-1 to understand what's going on.";
        break;
      default:
        suggestedAction = "Review this student's progress and reach out.";
    }

    return {
      studentId: alert.student_id,
      studentName: "", // populated by caller
      alertType: alert.alert_type,
      alertAge: ageHours,
      suggestedAction,
    };
  });

  // Determine escalation level based on oldest unread alert
  const oldestHours = Math.max(...studentsNeedingAttention.map((s) => s.alertAge));
  let escalationLevel: EscalationResult["escalationLevel"] = "none";
  if (oldestHours >= 72) escalationLevel = "critical";
  else if (oldestHours >= 48) escalationLevel = "urgent";
  else if (oldestHours >= 24) escalationLevel = "reminder";

  return {
    studentsNeedingAttention,
    teacherLastActive: null,
    escalationLevel,
  };
}

/**
 * Get platform-initiated interventions for students whose teachers are unresponsive.
 * Returns adjusted settings per student (gentler AI, suppress competitive features).
 */
export function getStudentAdjustments(alertType: string, ageHours: number) {
  const adjustments: {
    suppressLeaderboard: boolean;
    gentlerTone: boolean;
    suggestVoiceInput: boolean;
    flexiblePacing: boolean;
  } = {
    suppressLeaderboard: false,
    gentlerTone: false,
    suggestVoiceInput: false,
    flexiblePacing: false,
  };

  if (ageHours >= 48) {
    // Teacher hasn't responded in 48+ hours — platform takes over
    adjustments.gentlerTone = true;
    adjustments.flexiblePacing = true;

    if (alertType === "emotional" || alertType === "inactive") {
      adjustments.suppressLeaderboard = true;
    }
  }

  return adjustments;
}
