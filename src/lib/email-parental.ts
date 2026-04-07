import "server-only";
import { Resend } from "resend";

/**
 * Parental consent email — separate from crisis email so we can iterate on
 * the legal copy without touching the crisis path.
 *
 * IMPORTANT: the language in this email needs lawyer review before being
 * enabled in production for under-13 students. Current copy is a placeholder
 * that captures the SHAPE of what's required by COPPA: clear identification
 * of who's asking, what data will be collected, and an unambiguous yes/no.
 */

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? "alerts@adaptable.app";

export interface ParentalConsentEmailParams {
  to: string;
  studentId: string;
  verificationUrl: string;
}

export async function sendParentalConsentEmail(params: ParentalConsentEmailParams): Promise<{ ok: boolean; error?: string }> {
  if (!resendClient) {
    console.error("[parental-consent-email] RESEND_API_KEY not set");
    return { ok: false, error: "RESEND_API_KEY not set" };
  }

  const subject = "A child wants to use Adaptable — your permission is needed";
  const text = `Hi,

A child has signed up for Adaptable, an AI-powered platform where students design and plan small businesses. Because the child is under 13, we are required by US law (COPPA) to ask for your permission before they can use it.

What we collect from the child:
- Their first name and email address (for login)
- Their answers to the Ikigai discovery (what they love, what they're good at, what they think the world needs)
- Their conversations with our AI mentor as they work through lessons
- Their progress through the program

What we DO NOT collect:
- Phone number
- Home address
- Social security number
- Financial information
- Any data we share with advertisers (we never sell student data)

You can review our full privacy policy at ${process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://adaptable.app"}/privacy-policy

If you APPROVE this child using Adaptable, click here:
${params.verificationUrl}

The link will expire in 7 days. You can revoke permission anytime by emailing privacy@adaptable.app.

If this email was sent to you by mistake, you can simply ignore it — without your approval, the child cannot use the platform.

Thanks,
The Adaptable team

---
This is a legally-required parental consent request. Please do not forward.`;

  const html = `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111; line-height: 1.55;">
  <h2 style="color: #111; font-size: 20px; margin: 0 0 16px;">A child wants to use Adaptable</h2>
  <p>A child has signed up for Adaptable, an AI-powered platform where students design and plan small businesses. Because the child is under 13, we are required by US law (COPPA) to ask for your permission before they can use it.</p>

  <h3 style="font-size: 15px; margin: 24px 0 8px;">What we collect from the child</h3>
  <ul style="margin: 0; padding-left: 20px;">
    <li>Their first name and email (for login)</li>
    <li>Their answers to the Ikigai discovery</li>
    <li>Their conversations with our AI mentor</li>
    <li>Their progress through the program</li>
  </ul>

  <h3 style="font-size: 15px; margin: 24px 0 8px;">What we do NOT collect</h3>
  <ul style="margin: 0; padding-left: 20px;">
    <li>Phone number, home address, SSN</li>
    <li>Financial information</li>
    <li>Anything shared with advertisers (we never sell student data)</li>
  </ul>

  <div style="margin: 32px 0;">
    <a href="${params.verificationUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Approve and let them use Adaptable</a>
  </div>

  <p style="font-size: 13px; color: #6b7280;">Link expires in 7 days. To revoke permission anytime, email privacy@adaptable.app.</p>

  <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">If this email was sent to you by mistake, ignore it — without your approval, the child cannot use the platform. This is a legally-required parental consent request.</p>
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
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
