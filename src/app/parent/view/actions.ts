"use server";

import { createClient } from "@/lib/supabase/server";
import { hashPin, verifyPin as verifyPinHash } from "@/lib/pin";

/**
 * Rate limit state stored in-memory per token.
 * In production with multiple serverless instances, use Redis or DB.
 * For Vercel serverless, this resets per cold start, which is acceptable
 * as a defense-in-depth layer alongside the client-side attempt counter.
 */
const rateLimitMap = new Map<string, { attempts: number; lockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(token: string): { allowed: boolean; error?: string } {
  const now = Date.now();
  const entry = rateLimitMap.get(token);

  if (entry) {
    // Check lockout
    if (entry.lockedUntil > now) {
      const minutesLeft = Math.ceil((entry.lockedUntil - now) / 60_000);
      return {
        allowed: false,
        error: `Too many attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}.`,
      };
    }

    // Reset if lockout expired
    if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
      rateLimitMap.delete(token);
      return { allowed: true };
    }
  }

  return { allowed: true };
}

function recordAttempt(token: string): void {
  const entry = rateLimitMap.get(token) ?? { attempts: 0, lockedUntil: 0 };
  entry.attempts += 1;

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
  }

  rateLimitMap.set(token, entry);
}

function clearAttempts(token: string): void {
  rateLimitMap.delete(token);
}

export async function verifyPin(
  token: string,
  pin: string
): Promise<{ success?: boolean; error?: string }> {
  // Server-side rate limit check
  const rateCheck = checkRateLimit(token);
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
    clearAttempts(token);

    // Set a server-side cookie to mark verification
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

  recordAttempt(token);
  const entry = rateLimitMap.get(token);
  const remaining = MAX_ATTEMPTS - (entry?.attempts ?? 0);

  if (remaining <= 0) {
    return { error: "Too many attempts. Try again in 15 minutes." };
  }

  return { error: `Incorrect PIN. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` };
}

/* ─── Parent message rate limit ─── */
const messageLimitMap = new Map<string, { count: number; resetAt: number }>();

const MAX_MESSAGES_PER_DAY = 3;

function checkMessageLimit(token: string): { allowed: boolean; error?: string } {
  const now = Date.now();
  const entry = messageLimitMap.get(token);

  if (entry) {
    if (now > entry.resetAt) {
      messageLimitMap.delete(token);
      return { allowed: true };
    }
    if (entry.count >= MAX_MESSAGES_PER_DAY) {
      return {
        allowed: false,
        error: "You can send up to 3 messages per day. Try again tomorrow.",
      };
    }
  }

  return { allowed: true };
}

function recordMessage(token: string): void {
  const now = Date.now();
  const entry = messageLimitMap.get(token) ?? {
    count: 0,
    resetAt: now + 24 * 60 * 60 * 1000,
  };
  entry.count += 1;
  messageLimitMap.set(token, entry);
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

  // Rate limit
  const limitCheck = checkMessageLimit(token);
  if (!limitCheck.allowed) {
    return { error: limitCheck.error };
  }

  // Verify cookie
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const verifiedCookie = cookieStore.get(`parent_verified_${token}`);
  if (!verifiedCookie || verifiedCookie.value !== "true") {
    return { error: "Session expired. Please refresh and re-enter your PIN." };
  }

  const supabase = await createClient();

  // Look up student
  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("parent_access_token", token)
    .single();

  if (!student) {
    return { error: "Student not found." };
  }

  // Find class and teacher
  const { data: enrollment } = await supabase
    .from("class_enrollments")
    .select("class_id")
    .eq("student_id", student.id)
    .limit(1)
    .single();

  if (!enrollment) {
    return { error: "No class found for this student." };
  }

  // Insert alert via the teacher_alerts table
  const { error } = await supabase.from("teacher_alerts").insert({
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

  recordMessage(token);
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
