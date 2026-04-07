import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PrivacyClient from "./PrivacyClient";

export const metadata = {
  title: "Your Data & Privacy — Adaptable",
};

export default async function PrivacyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Look for any pending deletion request
  const { data: pendingDeletion } = await supabase
    .from("deletion_requests")
    .select("id, scheduled_for, created_at")
    .eq("student_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)] py-10">
      <div className="mx-auto max-w-2xl px-6">
        <PrivacyClient
          studentId={user.id}
          pendingDeletion={pendingDeletion ?? null}
        />
      </div>
    </main>
  );
}
