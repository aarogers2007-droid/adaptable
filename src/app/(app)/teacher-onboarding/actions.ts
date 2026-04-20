"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Generate a class code from a class name.
 * Uppercase abbreviation, max 8 chars, appends number if collision.
 */
function generateCode(name: string): string {
  // Take first letters of each word, uppercase, max 6 chars
  const words = name.trim().split(/\s+/).filter(Boolean);
  let code = words.map((w) => w[0]).join("").toUpperCase().slice(0, 6);
  if (code.length < 3) {
    // If too short, take more chars from the first word
    code = name.replace(/\s+/g, "").toUpperCase().slice(0, 6);
  }
  return code;
}

/**
 * Check if a code already exists, append number if needed.
 */
export async function getAvailableCode(name: string): Promise<string> {
  const supabase = await createClient();
  const base = generateCode(name);

  // Check if base exists
  const { data: existing } = await supabase
    .from("invite_codes")
    .select("code")
    .like("code", `${base}%`);

  const existingCodes = new Set((existing ?? []).map((e) => e.code));

  if (!existingCodes.has(base)) return base;

  // Append numbers until we find one that's free
  for (let i = 1; i <= 99; i++) {
    const candidate = `${base}${i}`.slice(0, 8);
    if (!existingCodes.has(candidate)) return candidate;
  }

  // Fallback: random suffix
  return `${base.slice(0, 5)}${Math.floor(Math.random() * 900 + 100)}`;
}

/**
 * Create a class with an invite code after teacher onboarding.
 */
export async function createTeacherClass(data: {
  className: string;
  gradeLevel: string;
  classCode: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify the user is an instructor
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "instructor") {
    return { error: "Not an instructor" };
  }

  // Create or use default org
  let orgId = profile.org_id;
  if (!orgId) {
    // Create a personal org for this teacher
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: `${data.className} School` })
      .select("id")
      .single();

    if (orgError || !org) return { error: "Failed to create organization" };
    orgId = org.id;

    await supabase
      .from("profiles")
      .update({ org_id: orgId })
      .eq("id", user.id);
  }

  // Create the class
  const { data: cls, error: classError } = await supabase
    .from("classes")
    .insert({
      org_id: orgId,
      instructor_id: user.id,
      name: data.className,
      session_type: "curriculum",
    })
    .select("id")
    .single();

  if (classError || !cls) {
    console.error("[teacher-onboarding] class creation failed:", classError);
    return { error: "Failed to create class" };
  }

  // Create the invite code
  const { error: codeError } = await supabase
    .from("invite_codes")
    .insert({
      code: data.classCode.toUpperCase(),
      class_id: cls.id,
      created_by: user.id,
      max_uses: 200,
      current_uses: 0,
    });

  if (codeError) {
    console.error("[teacher-onboarding] invite code creation failed:", codeError);
    return { error: "Failed to create class code" };
  }

  return { success: true, classId: cls.id };
}
