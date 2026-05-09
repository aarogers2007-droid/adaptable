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
  "https://adaptable.one";

export interface CrisisEmailParams {
  to: string | string[];
  studentFirstName: string;
  crisisType: string;
  matchedPatternHint: string;
  alertId: string;
  classId: string;
  timestamp: string;
  // New fields for redesigned template
  orgName?: string;
  programType?: string;
  gradeLevel?: string;
  detectedLanguage?: string;
  region?: string;
  alertRecipients?: string[];
  studentCrisisMessage?: string; // the message shown to the student (resources), NOT their input
}

/**
 * Send a redesigned crisis alert email to educators/admins.
 *
 * Privacy: NEVER includes student last name or exact message text.
 * Includes: first name, grade level, detected language, signal type,
 * regional crisis resources, contagion-aware guidance.
 */
export async function sendCrisisAlertEmail(
  supabase: SupabaseClient,
  params: CrisisEmailParams
): Promise<{ ok: boolean; error?: string }> {
  if (!resendClient) {
    await logNotificationFailure(supabase, params.alertId, "resend_not_configured");
    return { ok: false, error: "RESEND_API_KEY not set" };
  }

  const { getRegionalResources, formatCrisisResourcesForEmail } = await import("@/lib/crisis-resources");
  const resources = getRegionalResources(params.region ?? "US");
  const resourcesHtml = formatCrisisResourcesForEmail(resources);
  const regionLabel = (params.region ?? "US").toUpperCase();

  const dashboardUrl = `${APP_BASE_URL}/instructor/dashboard?alert=${params.alertId}`;
  const orgName = params.orgName ?? "your program";
  const programType = params.programType ?? "Lesson";
  const gradeLevel = params.gradeLevel ?? "Not specified";
  const detectedLang = params.detectedLanguage ?? "English";
  const recipients = params.alertRecipients ?? [typeof params.to === "string" ? params.to : params.to[0]];

  const subject = `Crisis signal detected — ${escapeHtml(params.studentFirstName)} — ${escapeHtml(programType)} — ${escapeHtml(orgName)}`;

  const text = `A student in your ${orgName} program has triggered a crisis detection alert.

Student: ${params.studentFirstName} (first name only)
Program: ${programType}
Grade Level: ${gradeLevel}
Detected language: ${detectedLang}
Signal type: ${params.crisisType}
Time: ${params.timestamp}

RECOMMENDED RESPONSE:
Contact this student privately and one-on-one. Do not discuss this incident publicly or with other students. If your organization follows contagion-aware protocols, follow your organization's established postvention guidelines before taking action.

Please open your dashboard now:
${dashboardUrl}

This alert was sent to: ${recipients.join(", ")}

This message is confidential and should not be forwarded outside your safeguarding chain.`;

  const html = `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
  <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
    <h2 style="margin: 0 0 8px; color: #991b1b; font-size: 18px;">Crisis signal detected</h2>
    <p style="margin: 0; color: #991b1b; font-size: 14px;">A student in your ${escapeHtml(orgName)} program needs attention.</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Student</td><td style="padding: 8px 0; font-weight: 600;">${escapeHtml(params.studentFirstName)}</td></tr>
    <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Program</td><td style="padding: 8px 0;">${escapeHtml(programType)}</td></tr>
    <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Grade level</td><td style="padding: 8px 0;">${escapeHtml(gradeLevel)}</td></tr>
    <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Language detected</td><td style="padding: 8px 0;">${escapeHtml(detectedLang)}</td></tr>
    <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Signal type</td><td style="padding: 8px 0;">${escapeHtml(params.crisisType)}</td></tr>
    <tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Time</td><td style="padding: 8px 0;">${escapeHtml(params.timestamp)}</td></tr>
  </table>

  <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
    <h3 style="margin: 0 0 8px; font-size: 14px; color: #92400e;">Recommended response</h3>
    <p style="margin: 0; font-size: 13px; color: #78350f;">Contact this student privately and one-on-one. Do not discuss this incident publicly or with other students. If your organization follows contagion-aware protocols, follow your established postvention guidelines before taking action.</p>
  </div>

  <h3 style="font-size: 14px; margin: 0 0 8px;">Crisis resources for this region (${escapeHtml(regionLabel)})</h3>
  <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 13px;">${resourcesHtml}</ul>

  <a href="${dashboardUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">Open dashboard</a>

  <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">This alert was sent to: ${escapeHtml(recipients.join(", "))}</p>
  <p style="font-size: 12px; color: #9ca3af;">This message is confidential. Do not forward outside your safeguarding chain.</p>
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

/**
 * Send a parent notification that their child's thinker profile is ready.
 * Only sends to verified parent emails from the COPPA consent flow.
 */
export async function sendCardReadyEmail(params: {
  to: string;
  studentFirstName: string;
  shareableUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resendClient) {
    return { ok: false, error: "RESEND_API_KEY not set" };
  }

  const subject = `${escapeHtml(params.studentFirstName)}'s thinker profile is ready`;
  const text = `Hi — ${params.studentFirstName} completed an activity today and their thinker profile is ready. Here is a link to see it:

${params.shareableUrl}

This link can be saved and shared with anyone.`;

  try {
    const result = await resendClient.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject,
      text,
    });

    if (result.error) {
      console.error("[email] Card ready email failed:", result.error.message);
      return { ok: false, error: result.error.message };
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[email] Card ready email exception:", msg);
    return { ok: false, error: msg };
  }
}

/**
 * Send a parent crisis alert email — warmer tone, no clinical language.
 * Uses "signs of emotional distress" not signal types.
 * Never includes student last name or message text.
 */
export async function sendParentCrisisEmail(params: {
  to: string;
  studentFirstName: string;
  region?: string;
  platformName?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resendClient) {
    return { ok: false, error: "RESEND_API_KEY not set" };
  }

  const { getRegionalResources, formatCrisisResourcesForStudent } = await import("@/lib/crisis-resources");
  const resources = getRegionalResources(params.region ?? "US");
  const resourceText = formatCrisisResourcesForStudent(resources);
  const pn = params.platformName ?? "the platform";

  const subject = `About ${params.studentFirstName}'s account`;
  const text = `Hi,

We wanted to let you know that ${params.studentFirstName}'s activity on ${pn} showed signs of emotional distress today.

We've already shown ${params.studentFirstName} some resources in the app, and the program administrator has been notified. We're sharing this with you so you can check in with them when the time is right.

Here are some resources that may help:

${resourceText}

You know your child best. Trust your instincts.

If you have questions, reply to this email.`;

  try {
    const result = await resendClient.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject,
      text,
    });
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
