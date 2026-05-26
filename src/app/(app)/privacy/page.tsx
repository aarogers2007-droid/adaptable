import { createClient } from "@/lib/supabase/server";
import PrivacyClient from "./PrivacyClient";

export const metadata = {
  title: "Your Data & Privacy — Adaptable",
  description:
    "We never sell student data. Download your data or request account deletion anytime.",
};

export default async function PrivacyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let pendingDeletion = null;
  if (user) {
    const { data } = await supabase
      .from("deletion_requests")
      .select("id, scheduled_for, created_at")
      .eq("student_id", user.id)
      .eq("status", "pending")
      .maybeSingle();
    pendingDeletion = data;
  }

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)] py-10">
      <div className="mx-auto max-w-2xl px-6">
        <PrivacyClient
          studentId={user?.id ?? null}
          pendingDeletion={pendingDeletion ?? null}
        />
      </div>
    </main>
  );
}
