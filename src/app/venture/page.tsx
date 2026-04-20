import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VentureLanding from "./VentureLanding";

export const dynamic = "force-dynamic";

/**
 * Public landing page for the VENTURE invention event.
 * Shareable URL: /venture
 *
 * - Shows event info + pentagon diagram
 * - "Begin" button routes to signup if not authenticated,
 *   or /invention if already enrolled in VENTURE
 */
export default async function VenturePage() {
  // Check if user is already authenticated and enrolled
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isEnrolled = false;
  if (user) {
    const { data: enrollment } = await supabase
      .from("class_enrollments")
      .select("class_id, classes(session_type)")
      .eq("student_id", user.id)
      .limit(1)
      .single();

    const sessionType = (enrollment?.classes as unknown as { session_type: string } | null)?.session_type;
    if (sessionType === "invention") {
      isEnrolled = true;
    }
  }

  return <VentureLanding isAuthenticated={!!user} isEnrolled={isEnrolled} />;
}
