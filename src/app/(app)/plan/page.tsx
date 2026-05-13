import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Lesson, BusinessIdea, IkigaiResult } from "@/lib/types";
import AppNav from "@/components/ui/AppNav";
import Link from "next/link";
import BusinessPlanFolder from "@/components/business-plan/BusinessPlanFolder";

export default async function BusinessPlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, lessonsRes, progressRes, pitchRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("lessons").select("*").order("module_sequence").order("lesson_sequence"),
    supabase.from("student_progress").select("*").eq("student_id", user.id),
    supabase
      .from("business_pitches")
      .select("*")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const profile = profileRes.data as unknown as Profile | null;
  if (!profile?.business_idea) redirect("/onboarding");

  const businessIdea = profile.business_idea as BusinessIdea;
  const ikigaiResult = profile.ikigai_result as IkigaiResult | null;
  const isAdmin = profile.role === "org_admin";

  const allLessons = (lessonsRes.data ?? []) as unknown as Lesson[];
  const allProgress = (progressRes.data ?? []) as unknown as { lesson_id: string; status: string; artifacts: Record<string, unknown> | null }[];
  const completedCount = allProgress.filter((p) => p.status === "completed").length;

  const pitch = pitchRes.data as { pitch_text: string; ai_feedback: string | null } | null;

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <AppNav isAdmin={isAdmin} studentName={profile.full_name || undefined} />

      <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6 flex flex-col items-center">
        {/* Header */}
        <div className="w-full mb-8">
          <p className="text-xs font-medium text-[var(--primary)] uppercase tracking-wider">
            Business Plan
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
            {businessIdea.name}
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            by {profile.full_name ?? "Student Founder"} · {completedCount}/{allLessons.length} lessons complete
          </p>
        </div>

        {/* Folder */}
        <BusinessPlanFolder
          studentName={profile.full_name ?? "Student Founder"}
          businessName={businessIdea.name ?? "My Business"}
          ikigai={ikigaiResult ? {
            love: ikigaiResult.passions.join(", "),
            goodAt: ikigaiResult.skills.join(", "),
            needs: ikigaiResult.needs.join(", "),
            paid: ikigaiResult.monetization,
          } : undefined}
          whatWeDo={businessIdea.niche}
          targetCustomer={businessIdea.target_customer}
          revenueModel={businessIdea.revenue_model}
          pitchText={pitch?.pitch_text}
        />

        {/* Footer */}
        <div className="w-full mt-10 pt-6 border-t border-[var(--border)] flex items-center justify-between">
          <div className="text-xs text-[var(--text-muted)]">
            {completedCount}/{allLessons.length} lessons · Adaptable
          </div>
          <div className="flex gap-3">
            <Link href="/card" className="text-xs font-medium text-[var(--primary)] hover:underline">
              Business Card
            </Link>
            <Link href="/dashboard" className="text-xs font-medium text-[var(--primary)] hover:underline">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
