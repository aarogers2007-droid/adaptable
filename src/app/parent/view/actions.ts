"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Verify parent PIN against stored bcrypt hash.
 * For v1, we do a simple comparison since bcrypt needs a separate lib.
 * TODO: Add bcrypt hashing when students set their PIN.
 */
export async function verifyPin(
  token: string,
  pin: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("profiles")
    .select("parent_access_pin")
    .eq("parent_access_token", token)
    .single();

  if (!student) {
    return { error: "Student not found" };
  }

  // Simple comparison for now. In production, use bcrypt.compare()
  if (!student.parent_access_pin) {
    return { error: "No PIN has been set. Ask your student to set one in their settings." };
  }

  if (student.parent_access_pin === pin) {
    return { success: true };
  }

  return { error: "Incorrect PIN" };
}
