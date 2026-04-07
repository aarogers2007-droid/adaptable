import "server-only";
import { Resend } from "resend";
import { type SupabaseClient } from "@supabase/supabase-js";

/**
 * Email sender for transactional notifications.
 *
 * Currently used for:
 *   - Real-time crisis alerts to instructors (highest priority, P0 safety)
 *
 * Future:
 *   - Parental consent verification links (COPPA flow)
 *   - Data deletion confirmation
 *   - Daily digest of class activity
 *
 * Failure mode: if Resend fails (API down, network blip, missing API key),
 * we write a row to notification_failures so the next dashboard load surfaces
 * the failed delivery hard. NEVER fail silently on a crisis path.
 */

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? "alerts@adaptable.app";
const APP_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "https://adaptable.app";

export interface CrisisEmailParams {
  to: string;
  studentFirstName: string;
  crisisType: string;
  matchedPatternHint: string; // sanitized — NOT the full message
  alertId: string;
  classId: string;
  timestamp: string;
}

/**
 * Send a real-time crisis alert email to an instructor.
 *
 * Privacy: we deliberately do NOT include the student's full message.
 * Instructors get the type of crisis signal + a hint of the matched
 * pattern category + a link to the dashboard where they can see the
 * full context (under RLS, only the instructor for that class).
 */
export async function sendCrisisAlertEmail(
  supabase: SupabaseClient,
  params: CrisisEmailParams
): Promise<{ ok: boolean; error?: string }> {
  if (!resendClient) {
    await logNotificationFailure(supabase, params.alertId, "resend_not_configured");
    return { ok: false, error: "RESEND_API_KEY not set" };
  }

  const dashboardUrl = `${APP_BASE_URL}/instructor/dashboard?alert=${params.alertId}`;

  const subject = `URGENT: Possible crisis signal from ${params.studentFirstName}`;
  const text = `A student in your class may need immediate attention.

Student: ${params.studentFirstName}
Signal type: ${params.crisisType}
Pattern category: ${params.matchedPatternHint}
Time: ${params.timestamp}

Please open your dashboard now to see the full context and respond:
${dashboardUrl}

If you cannot respond within the next hour, please escalate to your school counselor or administrator immediately.

This message is confidential and should not be forwarded outside your school's safeguarding chain.`;

  const html = `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
  <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
    <h2 style="margin: 0 0 8px; color: #991b1b; font-size: 18px;">URGENT: Possible crisis signal</h2>
    <p style="margin: 0; color: #991b1b; font-size: 14px;">A student in your class may need immediate attention.</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Student</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(params.studentFirstName)}</td></tr>
    <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Signal type</td><td style="padding: 8px 0;">${escapeHtml(params.crisisType)}</td></tr>
    <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Pattern</td><td style="padding: 8px 0;">${escapeHtml(params.matchedPatternHint)}</td></tr>
    <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Time</td><td style="padding: 8px 0;">${escapeHtml(params.timestamp)}</td></tr>
  </table>

  <a href="${dashboardUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">Open dashboard</a>

  <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">If you cannot respond within the next hour, escalate to your school counselor or administrator immediately.</p>

  <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">This message is confidential. Do not forward outside your school's safeguarding chain.</p>
</body>
</html>`;

  try {
    const result = await resendClient.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject,
      text,
      html,
    });

    if (result.error) {
      await logNotificationFailure(supabase, params.alertId, `resend_error: ${result.error.message}`);
      return { ok: false, error: result.error.message };
    }

    // Mark the alert as notified
    await supabase
      .from("teacher_alerts")
      .update({
        notified_at: new Date().toISOString(),
        notification_channel: "email",
      })
      .eq("id", params.alertId);

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logNotificationFailure(supabase, params.alertId, `exception: ${msg}`);
    return { ok: false, error: msg };
  }
}

async function logNotificationFailure(
  supabase: SupabaseClient,
  alertId: string,
  reason: string
) {
  // Mark on the alert itself for dashboard surfacing
  await supabase
    .from("teacher_alerts")
    .update({
      notification_failed: true,
      notification_channel: "email_failed",
    })
    .eq("id", alertId);

  // Also write to notification_failures for ops visibility
  await supabase.from("notification_failures").insert({
    alert_id: alertId,
    channel: "email",
    reason: reason.slice(0, 500),
    created_at: new Date().toISOString(),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
