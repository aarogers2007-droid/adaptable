import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the session_type for the user's enrolled class.
 * If enrolled in multiple classes, returns the first match.
 * Returns 'curriculum' as default if no class found.
 */
export async function getSessionType(userId: string): Promise<"curriculum" | "invention"> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("class_enrollments")
    .select("class_id, classes(session_type)")
    .eq("student_id", userId)
    .limit(1)
    .single();

  if (!data) return "curriculum";

  const cls = data.classes as unknown as { session_type: string } | null;
  return (cls?.session_type === "invention" ? "invention" : "curriculum");
}
