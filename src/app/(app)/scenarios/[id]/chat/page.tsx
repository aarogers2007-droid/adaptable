import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ScenarioChat from "./ScenarioChat";
import { RUBRIC_MAP } from "@/lib/scenario-rubric";

export const dynamic = "force-dynamic";

export default async function ScenarioChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { id: scenarioId } = await params;
  const { session: sessionId } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("id, title, situation, industry, difficulty, rubric_criteria, is_sponsored, sponsor_name, sponsor_logo_url, badge_name, badge_icon")
    .eq("id", scenarioId)
    .eq("is_active", true)
    .single();

  if (!scenario) redirect("/scenarios");

  const criteriaLabels = (scenario.rubric_criteria as string[]).map((id) => {
    const c = RUBRIC_MAP.get(id);
    return { id, label: c?.short_label ?? id };
  });

  // Load existing session if provided
  let existingSession: {
    id: string;
    conversation: { role: string; content: string }[];
    criteria_satisfied: string[];
  } | null = null;

  if (sessionId) {
    const { data: sess } = await supabase
      .from("student_scenario_sessions")
      .select("id, conversation, criteria_satisfied")
      .eq("id", sessionId)
      .eq("student_id", user.id)
      .eq("status", "in_progress")
      .single();

    if (sess) {
      existingSession = {
        id: sess.id,
        conversation: (sess.conversation as { role: string; content: string }[]) ?? [],
        criteria_satisfied: sess.criteria_satisfied ?? [],
      };
    }
  }

  // Check if student has an existing badge for this scenario
  const { data: badge } = await supabase
    .from("student_badges")
    .select("badge_level")
    .eq("student_id", user.id)
    .eq("scenario_id", scenarioId)
    .single();

  return (
    <ScenarioChat
      scenarioId={scenario.id}
      scenario={{
        title: scenario.title,
        situation: scenario.situation,
        industry: scenario.industry,
        difficulty: scenario.difficulty,
        isSponsored: scenario.is_sponsored,
        sponsorName: scenario.sponsor_name,
        sponsorLogoUrl: scenario.sponsor_logo_url,
        badgeName: scenario.badge_name,
        badgeIcon: scenario.badge_icon,
      }}
      criteriaLabels={criteriaLabels}
      existingSession={existingSession}
      existingBadgeLevel={badge?.badge_level ?? null}
    />
  );
}
