import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppNav from "@/components/ui/AppNav";
import ScenariosLibrary from "./ScenariosLibrary";

export const dynamic = "force-dynamic";

export default async function ScenariosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email, business_idea")
    .eq("id", user.id)
    .single();

  if (!profile?.business_idea) redirect("/onboarding");

  // Load all active scenarios
  const { data: scenarios } = await supabase
    .from("scenarios")
    .select("id, title, situation, industry, difficulty, rubric_criteria, is_sponsored, sponsor_name, badge_name, badge_icon")
    .eq("is_active", true)
    .order("difficulty", { ascending: true });

  // Load student's badges
  const { data: badges } = await supabase
    .from("student_badges")
    .select("scenario_id, badge_level")
    .eq("student_id", user.id);

  // Load in-progress sessions
  const { data: sessions } = await supabase
    .from("student_scenario_sessions")
    .select("scenario_id, status")
    .eq("student_id", user.id)
    .eq("status", "in_progress");

  const badgeMap = new Map((badges ?? []).map((b) => [b.scenario_id, b.badge_level]));
  const inProgressSet = new Set((sessions ?? []).map((s) => s.scenario_id));

  const scenariosWithStatus = (scenarios ?? []).map((s) => ({
    ...s,
    rubric_criteria: s.rubric_criteria as string[],
    badgeLevel: badgeMap.get(s.id) ?? null,
    inProgress: inProgressSet.has(s.id),
  }));

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)]">
      <AppNav
        isAdmin={profile.role === "org_admin"}
        studentName={profile.full_name || profile.email || undefined}
      />
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
          Scenarios
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Real business challenges. Think your way through them.
        </p>
        <ScenariosLibrary scenarios={scenariosWithStatus} />
      </div>
    </main>
  );
}
