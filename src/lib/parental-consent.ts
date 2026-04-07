"use server";

import { createClient } from "@/lib/supabase/server";
import { createHash, randomBytes } from "crypto";

/**
 * Parental consent flow for COPPA-covered students (under 13).
 *
 * Flow:
 *   1. Student signs up with DOB < 13 → consent_status='pending_parental'
 *   2. Server generates a single-use token, stores hash in parental_consent_tokens
 *   3. Email sent to parent_email with a verification link containing the raw token
 *   4. Parent clicks link → loads /parental-consent/[token] → grants or denies
 *   5. On grant: insert student_consent row, update profile to 'parental_verified'
 *   6. Student is unlocked
 *
 * The TOKEN itself is never stored in the DB — only the SHA256 hash. This means
 * a DB leak does not give an attacker working tokens.
 *
 * IMPORTANT: this is the technical scaffolding only. Real legal copy in the
 * consent email must be reviewed by a lawyer before this is enabled in
 * production for under-13 students.
 */

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://adaptable.app";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function startParentalConsent(
  studentId: string,
  parentEmail: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  // Generate a 32-byte URL-safe random token. The raw token goes in the email
  // link; only the hash is stored in the DB.
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);

  // Insert the consent token row (hash only)
  const { error: insertError } = await supabase.from("parental_consent_tokens").insert({
    student_id: studentId,
    token: tokenHash,
    parent_email: parentEmail.toLowerCase().trim(),
  });

  if (insertError) {
    console.error("[parental-consent] failed to insert token", insertError);
    return { ok: false, error: insertError.message };
  }

  // Send the email via the existing Resend wrapper
  try {
    const { sendParentalConsentEmail } = await import("@/lib/email-parental");
    await sendParentalConsentEmail({
      to: parentEmail,
      studentId,
      verificationUrl: `${APP_BASE_URL}/parental-consent/${rawToken}`,
    });
  } catch (e) {
    console.error("[parental-consent] email send failed", e);
    return { ok: false, error: "Email send failed" };
  }

  return { ok: true };
}

export async function verifyParentalConsent(
  rawToken: string,
  outcome: "granted" | "denied",
  parentName?: string
): Promise<{ ok: boolean; studentId?: string; error?: string }> {
  const supabase = await createClient();
  const tokenHash = hashToken(rawToken);

  const { data: tokenRow } = await supabase
    .from("parental_consent_tokens")
    .select("id, student_id, parent_email, expires_at, used_at")
    .eq("token", tokenHash)
    .single();

  if (!tokenRow) return { ok: false, error: "Invalid or expired link" };
  if (tokenRow.used_at) return { ok: false, error: "This link has already been used" };
  if (new Date(tokenRow.expires_at) < new Date()) return { ok: false, error: "This link has expired" };

  // Mark token used
  await supabase
    .from("parental_consent_tokens")
    .update({
      used_at: new Date().toISOString(),
      consent_outcome: outcome,
    })
    .eq("id", tokenRow.id);

  if (outcome === "granted") {
    // Insert the consent record
    await supabase.from("student_consent").insert({
      student_id: tokenRow.student_id,
      consent_type: "parental_verified",
      consenting_party_email: tokenRow.parent_email,
      consenting_party_name: parentName ?? null,
      consenting_party_role: "parent",
      evidence: { method: "email_link", token_id: tokenRow.id },
    });

    // Update profile
    await supabase
      .from("profiles")
      .update({ consent_status: "parental_verified" })
      .eq("id", tokenRow.student_id);
  } else {
    // Denied — mark profile as denied
    await supabase
      .from("profiles")
      .update({ consent_status: "denied" })
      .eq("id", tokenRow.student_id);
  }

  return { ok: true, studentId: tokenRow.student_id };
}
