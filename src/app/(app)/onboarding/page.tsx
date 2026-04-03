import { redirect } from "next/navigation";
import IkigaiWizard from "@/components/ikigai/IkigaiWizard";
import type { IkigaiDraft } from "@/lib/types";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;

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

  // If reset requested, clear business idea and draft
  if (reset === "true") {
    await supabase
      .from("profiles")
      .update({ business_idea: null, ikigai_result: null, ikigai_draft: null, niche_recommendations: null })
      .eq("id", user.id);

    redirect("/onboarding");
  }

  // Check if already completed Ikigai — redirect to dashboard unless resetting
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_idea, ikigai_draft, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.business_idea) {
    redirect("/dashboard");
  }

  const draft = (profile?.ikigai_draft as IkigaiDraft) ?? null;
  const name = (profile?.full_name as string) ?? "";

  return <IkigaiWizard initialDraft={draft} initialName={name} />;
}
