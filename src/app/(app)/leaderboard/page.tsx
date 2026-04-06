import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLeaderboardData } from "@/lib/leaderboard";
import type { Profile, ClassEnrollment } from "@/lib/types";
import AppNav from "@/components/ui/AppNav";
import LeaderboardClient from "./LeaderboardClient";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as unknown as Profile | null;
  if (!profile?.business_idea) redirect("/onboarding");

  // Get current student's class enrollment
  const { data: enrollmentData } = await supabase
    .from("class_enrollments")
    .select("class_id")
    .eq("student_id", user.id)
    .limit(1)
    .single();

  const enrollment = enrollmentData as unknown as { class_id: string } | null;

  // Use admin client to bypass RLS for cross-student queries
  const admin = createAdminClient();

  // Get class student IDs
  let classStudentIds: string[] = [];
  if (enrollment) {
    const { data: classEnrollments } = await admin
      .from("class_enrollments")
      .select("student_id")
      .eq("class_id", enrollment.class_id);
    classStudentIds = (classEnrollments ?? []).map((e: { student_id: string }) => e.student_id);
  }

  // Get school (org) student IDs
  let schoolStudentIds: string[] = [];
  if (profile.org_id) {
    const { data: orgProfiles } = await admin
      .from("profiles")
      .select("id")
      .eq("org_id", profile.org_id)
      .eq("role", "student");
    schoolStudentIds = (orgProfiles ?? []).map((p: { id: string }) => p.id);
  }

  // If no class and no org, fall back to just the current student
  if (classStudentIds.length === 0 && schoolStudentIds.length === 0) {
    classStudentIds = [user.id];
    schoolStudentIds = [user.id];
  }

  // Compute leaderboard data for all combinations in parallel
  const [classAllTime, classThisWeek, schoolAllTime, schoolThisWeek] = await Promise.all([
    getLeaderboardData(admin, classStudentIds, user.id, "all_time"),
    getLeaderboardData(admin, classStudentIds, user.id, "this_week"),
    getLeaderboardData(admin, schoolStudentIds, user.id, "all_time"),
    getLeaderboardData(admin, schoolStudentIds, user.id, "this_week"),
  ]);

  // Late-joiner detection: if enrolled within the last 7 days, show "your pace" context
  const isRecentJoiner = profile.created_at
    ? (Date.now() - new Date(profile.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)]">
      <AppNav
        isAdmin={profile.role === "org_admin"}
        studentName={profile.full_name || profile.email || undefined}
      />

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {isRecentJoiner && (
          <div className="mb-4 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-4 py-3 text-sm text-[var(--text-secondary)]">
            You just started — these rankings will make more sense after your first week. Focus on your business for now.
          </div>
        )}
        <div className="mb-6">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
            Leaderboard
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            See how you stack up against your peers
          </p>
        </div>

        <LeaderboardClient
          classData={{
            allTime: classAllTime,
            thisWeek: classThisWeek,
          }}
          schoolData={{
            allTime: schoolAllTime,
            thisWeek: schoolThisWeek,
          }}
          currentStudentId={user.id}
          hasClass={!!enrollment}
        />
      </div>
    </main>
  );
}
