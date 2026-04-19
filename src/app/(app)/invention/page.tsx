import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InventionWizard from "./InventionWizard";

export const dynamic = "force-dynamic";

export default async function InventionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if already completed — show result page
  const { data: session } = await supabase
    .from("invention_sessions")
    .select("*")
    .eq("student_id", user.id)
    .limit(1)
    .single();

  // Load the student's name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <InventionWizard
      studentName={profile?.full_name ?? ""}
      existingSession={session ?? null}
    />
  );
}
