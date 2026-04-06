"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPin, verifyPin as verifyPinHash } from "@/lib/pin";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Database-backed rate limiting for parent PIN verification.
 * Uses a dedicated table to persist across serverless cold starts.
 * Falls back to permissive if table doesn't exist yet.
 */
async function checkRateLimitDB(token: string): Promise<{ allowed: boolean; remaining: number; error?: string }> {
  const admin = createAdminClient();

  // Get attempts in the lockout window
  const cutoff = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString();
  const { data: attempts, error } = await admin
    .from("parent_pin_attempts")
    .select("id")
    .eq("token_hash", hashTokenForStorage(token))
    .gte("attempted_at", cutoff);

  if (error) {
    // Table may not exist yet — fall back to allowing (defense in depth, not sole defense)
    console.warn("[parent-pin] Rate limit check failed:", error.message);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  const count = attempts?.length ?? 0;
  if (count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      remaining: 0,
      error: `Too many attempts. Try again in ${LOCKOUT_MINUTES} minutes.`,
    };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - count };
}

async function recordAttemptDB(token: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("parent_pin_attempts").insert({
    token_hash: hashTokenForStorage(token),
    attempted_at: new Date().toISOString(),
  }).then(() => {});
}

async function clearAttemptsDB(token: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("parent_pin_attempts")
    .delete()
    .eq("token_hash", hashTokenForStorage(token))
    .then(() => {});
}

/** Hash the token so we don't store raw parent access tokens in the attempts table */
function hashTokenForStorage(token: string): string {
  // Simple stable hash — not cryptographic, just prevents storing raw tokens
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `pin_${Math.abs(hash).toString(36)}`;
}

export async function verifyPin(
  token: string,
  pin: string
): Promise<{ success?: boolean; error?: string }> {
  // Database-backed rate limit check
  const rateCheck = await checkRateLimitDB(token);
  if (!rateCheck.allowed) {
    return { error: rateCheck.error };
  }

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("parent_access_pin")
    .eq("parent_access_token", token)
    .single();

  if (!student) {
    return { error: "Student not found" };
  }

  if (!student.parent_access_pin) {
    return { error: "No PIN has been set. Ask your student to set one in their settings." };
  }

  // bcrypt comparison
  const isValid = await verifyPinHash(pin, student.parent_access_pin as string);

  if (isValid) {
    await clearAttemptsDB(token);

    // Set a server-side cookie to mark verification
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.set(`parent_verified_${token}`, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/parent/view",
      maxAge: 60 * 60, // 1 hour
    });
    return { success: true };
  }

  await recordAttemptDB(token);
  const remaining = rateCheck.remaining - 1;

  if (remaining <= 0) {
    return { error: `Too many attempts. Try again in ${LOCKOUT_MINUTES} minutes.` };
  }

  return { error: `Incorrect PIN. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` };
}

export async function sendParentMessage(
  token: string,
  message: string
): Promise<{ success?: boolean; error?: string }> {
  // Validate message
  if (!message || typeof message !== "string") {
    return { error: "Please enter a message." };
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return { error: "Please enter a message." };
  }
  if (trimmed.length > 500) {
    return { error: "Message must be 500 characters or less." };
  }

  // Content moderation
  const { moderateContent } = await import("@/lib/content-moderation");
  const modResult = moderateContent(trimmed);
  if (!modResult.safe) {
    return { error: modResult.reason ?? "Message could not be sent." };
  }

  // Verify cookie
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const verifiedCookie = cookieStore.get(`parent_verified_${token}`);
  if (!verifiedCookie || verifiedCookie.value !== "true") {
    return { error: "Session expired. Please refresh and re-enter your PIN." };
  }

  // Look up student first (needed for rate limit filter)
  const admin = createAdminClient();
  const { data: student } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("parent_access_token", token)
    .single();

  if (!student) {
    return { error: "Student not found." };
  }

  // Rate limit: max 3 parent messages per day PER STUDENT (DB-backed)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentMsgs } = await admin
    .from("teacher_alerts")
    .select("id")
    .eq("alert_type", "parent_message")
    .eq("student_id", student.id)
    .gte("created_at", oneDayAgo)
    .limit(4);
  if (recentMsgs && recentMsgs.length >= 3) {
    return { error: "You can send up to 3 messages per day. Try again tomorrow." };
  }

  // Find class and teacher
  const { data: enrollment } = await admin
    .from("class_enrollments")
    .select("class_id")
    .eq("student_id", student.id)
    .limit(1)
    .single();

  if (!enrollment) {
    return { error: "No class found for this student." };
  }

  // Insert alert via the teacher_alerts table
  const { error } = await admin.from("teacher_alerts").insert({
    class_id: enrollment.class_id,
    student_id: student.id,
    alert_type: "parent_message",
    severity: "info",
    message: `Parent of ${student.full_name ?? "a student"} sent a message.`,
    context: {
      parent_message: trimmed,
      student_name: student.full_name,
      sent_at: new Date().toISOString(),
    },
    acknowledged: false,
  });

  if (error) {
    return { error: "Failed to send message. Please try again." };
  }

  return { success: true };
}

export async function createPin(
  token: string,
  pin: string
): Promise<{ success?: boolean; error?: string }> {
  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return { error: "PIN must be exactly 6 digits." };
  }

  const supabase = await createClient();

  // Look up the student by token
  const { data: student } = await supabase
    .from("profiles")
    .select("id, parent_access_pin")
    .eq("parent_access_token", token)
    .single();

  if (!student) {
    return { error: "Student not found." };
  }

  // Don't allow overwriting an existing PIN
  if (student.parent_access_pin) {
    return { error: "A PIN has already been set." };
  }

  const hashed = await hashPin(pin);

  const { error } = await supabase
    .from("profiles")
    .update({ parent_access_pin: hashed })
    .eq("id", student.id);

  if (error) {
    return { error: "Failed to save PIN. Please try again." };
  }

  // Set the verification cookie so parent goes straight to progress view
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set(`parent_verified_${token}`, "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
  });

  return { success: true };
}
