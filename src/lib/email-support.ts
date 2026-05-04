import "server-only";
import { Resend } from "resend";

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS ?? "support@adaptable.one";
const AJ_EMAIL = "aarogers2007@gmail.com";

export async function sendSupportEscalationEmail(params: {
  userName: string;
  userRole: string;
  summary: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!resendClient) {
    return { ok: false, error: "RESEND_API_KEY not set" };
  }

  const subject = `Support escalation from ${params.userName} (${params.userRole})`;
  const text = `A support issue was escalated by the AI.

User: ${params.userName} (${params.userRole})

Conversation summary:
${params.summary}

View all escalations on your dashboard: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://adaptable.one"}/aj`;

  try {
    const result = await resendClient.emails.send({
      from: FROM_ADDRESS,
      to: AJ_EMAIL,
      subject,
      text,
    });

    if (result.error) {
      console.error("[support-email] Send failed:", result.error.message);
      return { ok: false, error: result.error.message };
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[support-email] Exception:", msg);
    return { ok: false, error: msg };
  }
}
