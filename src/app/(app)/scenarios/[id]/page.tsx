import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AppNav from "@/components/ui/AppNav";
import { RUBRIC_MAP } from "@/lib/scenario-rubric";
import { BadgeDisplay } from "../ScenariosLibrary";

export const dynamic = "force-dynamic";

const DIFFICULTY_LABELS = ["", "Starter", "Intermediate", "Advanced"];

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  const { data: scenario } = await supabase
    .from("scenarios")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!scenario) notFound();

  // Student's badge for this scenario
  const { data: badge } = await supabase
    .from("student_badges")
    .select("badge_level")
    .eq("student_id", user.id)
    .eq("scenario_id", id)
    .single();

  // In-progress session
  const { data: activeSession } = await supabase
    .from("student_scenario_sessions")
    .select("id")
    .eq("student_id", user.id)
    .eq("scenario_id", id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  const rubricCriteria = (scenario.rubric_criteria as string[]).map((id) => RUBRIC_MAP.get(id)).filter(Boolean);

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)]">
      <AppNav
        isAdmin={profile?.role === "org_admin"}
        studentName={profile?.full_name || profile?.email || undefined}
      />
      <div className="mx-auto max-w-[640px] px-6 py-8">
        {/* Back link */}
        <Link
          href="/scenarios"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          &larr; All Scenarios
        </Link>

        {/* Header */}
        <div className="mt-6 flex items-start gap-4">
          <div className="flex-1">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
              {scenario.title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="rounded-full bg-[var(--bg-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)] capitalize">
                {scenario.industry}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {DIFFICULTY_LABELS[scenario.difficulty]}
              </span>
            </div>
          </div>
          <BadgeDisplay icon={scenario.badge_icon} level={badge?.badge_level ?? null} size="card" />
        </div>

        {/* Sponsor */}
        {scenario.is_sponsored && scenario.sponsor_name && (
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            {scenario.sponsor_logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={scenario.sponsor_logo_url} alt="" className="h-5 w-5 rounded" />
            )}
            <span>Sponsored by {scenario.sponsor_name}</span>
          </div>
        )}

        {/* Situation */}
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">
            {scenario.situation}
          </p>
        </div>

        {/* Skills developed */}
        <div className="mt-4">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Skills This Develops
          </p>
          <div className="flex flex-wrap gap-2">
            {rubricCriteria.map((c) => (
              <span
                key={c!.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
              >
                {c!.short_label}
              </span>
            ))}
          </div>
        </div>

        {/* Action button */}
        <div className="mt-8">
          {activeSession ? (
            <Link
              href={`/scenarios/${id}/chat?session=${activeSession.id}`}
              className="block w-full rounded-lg bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)]"
            >
              Continue Scenario
            </Link>
          ) : badge ? (
            <Link
              href={`/scenarios/${id}/chat`}
              className="block w-full rounded-lg border-2 border-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/5"
            >
              Replay — Try a Different Approach
            </Link>
          ) : (
            <Link
              href={`/scenarios/${id}/chat`}
              className="block w-full rounded-lg bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)]"
            >
              Start Scenario
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
