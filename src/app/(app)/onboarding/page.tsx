import { redirect } from "next/navigation";
import IkigaiWizard from "@/components/ikigai/IkigaiWizard";
import type { IkigaiDraft } from "@/lib/types";

export default async function OnboardingPage() {
  // Skip auth check when Supabase isn't configured (local preview)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return <IkigaiWizard initialDraft={null} />;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if already completed Ikigai
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_idea, ikigai_draft")
    .eq("id", user.id)
    .single();

  if (profile?.business_idea) {
    redirect("/dashboard");
  }

  const draft = (profile?.ikigai_draft as IkigaiDraft) ?? null;

  return <IkigaiWizard initialDraft={draft} />;
}
