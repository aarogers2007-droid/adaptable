"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyPin as verifyPinHash } from "@/lib/pin";

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
