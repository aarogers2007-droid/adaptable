import { createClient } from "@/lib/supabase/server";
import type { Profile, StudentProgress } from "@/lib/types";
import ParentPinForm from "./ParentPinForm";

export const dynamic = "force-dynamic";

export default async function ParentViewPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; verified?: string }>;
}) {
  const { token, verified } = await searchParams;

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-[var(--text-muted)]">Invalid link. Ask your student for the correct URL.</p>
      </main>
    );
  }

  const supabase = await createClient();

  // Look up student by access token
  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name, business_idea")
    .eq("parent_access_token", token)
    .single();

  if (!student) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-[var(--text-muted)]">Student not found. The link may be expired.</p>
      </main>
    );
  }

  const typedStudent = student as unknown as Profile;

  // If not yet verified with PIN, show PIN form
  // PIN verification is checked server-side via a signed cookie, not a query param
  const cookieStore = await (await import("next/headers")).cookies();
  const verifiedCookie = cookieStore.get(`parent_verified_${token}`);
  if (!verifiedCookie || verifiedCookie.value !== "true") {
    return <ParentPinForm token={token} studentName={typedStudent.full_name ?? "Your student"} />;
  }

  // Verified via server-side cookie: show progress
  const { data: progressData } = await supabase
    .from("student_progress")
    .select("status")
    .eq("student_id", typedStudent.id);

  const { count: totalLessons } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true });

  const completedCount = (progressData ?? []).filter((p) => p.status === "completed").length;
  const total = (totalLessons ?? 0) + 1; // +1 for Ikigai
  const ikigaiDone = typedStudent.business_idea ? 1 : 0;
  const completed = ikigaiDone + completedCount;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)]">
      <div className="border-b border-[var(--border)] bg-[var(--bg)] px-6 py-4 text-center">
        <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--primary)]">
          Adaptable
        </span>
        <p className="text-sm text-[var(--text-muted)]">Parent Progress View</p>
      </div>

      <div className="mx-auto max-w-lg px-6 py-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-center">
          {typedStudent.full_name}&apos;s Progress
        </h1>

        {typedStudent.business_idea ? (
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 text-center">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
              Their Business
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold">
              {typedStudent.business_idea.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {typedStudent.business_idea.niche}
            </p>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {typedStudent.business_idea.revenue_model}
            </p>

            <div className="mt-6">
              <div className="h-3 rounded-full bg-[var(--bg-muted)]">
                <div
                  className="h-3 rounded-full bg-[var(--primary)]"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {completed} of {total} milestones completed ({percentage}%)
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 text-center">
            <p className="text-[var(--text-secondary)]">
              {typedStudent.full_name} hasn&apos;t started their business journey yet.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
