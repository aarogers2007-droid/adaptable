import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Lesson, BusinessIdea, IkigaiResult } from "@/lib/types";
import AppNav from "@/components/ui/AppNav";
import Link from "next/link";

export default async function BusinessPlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, lessonsRes, progressRes, decisionsRes, pitchRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("lessons").select("*").order("module_sequence").order("lesson_sequence"),
    supabase.from("student_progress").select("*").eq("student_id", user.id),
    supabase.from("lesson_decisions").select("*").eq("student_id", user.id).order("created_at"),
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
  const studentName = profile.full_name?.split(" ")[0] ?? "Founder";
  const isAdmin = profile.role === "org_admin";

  const allLessons = (lessonsRes.data ?? []) as unknown as Lesson[];
  const allProgress = (progressRes.data ?? []) as unknown as { lesson_id: string; status: string; artifacts: Record<string, unknown> | null }[];
  const completedCount = allProgress.filter((p) => p.status === "completed").length;

  const decisions = (decisionsRes.data ?? []) as { decision_text: string; lesson_id: string }[];
  const lessonMap = new Map(allLessons.map((l) => [l.id, l]));
  const decisionsWithTitles = decisions.map((d) => ({
    text: d.decision_text,
    lessonTitle: lessonMap.get(d.lesson_id)?.title ?? "Lesson",
  }));

  const pitch = pitchRes.data as { pitch_text: string; ai_feedback: string | null } | null;

  // Extract interview insights if available
  const interviewProgress = allProgress.find((p) => p.artifacts?.interview_data);
  const hasInterviews = !!interviewProgress;

  // Group decisions by module
  const module1Decisions = decisionsWithTitles.filter((d) => {
    const lesson = allLessons.find((l) => l.title === d.lessonTitle);
    return lesson && lesson.module_sequence === 1;
  });
  const module2Decisions = decisionsWithTitles.filter((d) => {
    const lesson = allLessons.find((l) => l.title === d.lessonTitle);
    return lesson && lesson.module_sequence === 2;
  });

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <AppNav isAdmin={isAdmin} studentName={profile.full_name || undefined} />

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8">
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

        {/* Section 1: Vision */}
        <section className="mb-8">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">1</span>
            Vision
          </h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6 space-y-4">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase">What We Do</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{businessIdea.niche}</p>
            </div>
            {ikigaiResult && (
              <>
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase">Why This Matters to Me</p>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">
                    I'm passionate about {ikigaiResult.passions.slice(0, 2).join(" and ")},
                    skilled in {ikigaiResult.skills.slice(0, 2).join(" and ")},
                    and I see a need for {ikigaiResult.needs.slice(0, 2).join(" and ")}.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)] uppercase">How We Make Money</p>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">{ikigaiResult.monetization}</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Section 2: Customer */}
        <section className="mb-8">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">2</span>
            Customer
          </h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6 space-y-4">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase">Target Customer</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{businessIdea.target_customer}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase">Revenue Model</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{businessIdea.revenue_model}</p>
            </div>
            {hasInterviews && (
              <div className="rounded-lg bg-[var(--primary)]/5 px-4 py-3">
                <p className="text-xs font-medium text-[var(--primary)]">Customer Interview Practice Complete</p>
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Key Decisions — Niche & Competition */}
        <section className="mb-8">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${module1Decisions.length > 0 ? "bg-[var(--primary)]" : "bg-gray-300"}`}>3</span>
            <span className={module1Decisions.length > 0 ? "" : "text-[var(--text-muted)]"}>Niche & Competition</span>
          </h2>
          {module1Decisions.length > 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6 space-y-3">
              {module1Decisions.map((d, i) => (
                <div key={i}>
                  <p className="text-xs text-[var(--text-muted)]">{d.lessonTitle}</p>
                  <p className="text-sm text-[var(--text-primary)]">{d.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-subtle)]/50 p-6">
              <p className="text-xs text-[var(--text-muted)]">{"You'll fill this in during Module 1 lessons. Keep going!"}</p>
            </div>
          )}
        </section>

        {/* Section 4: Customer Insights & Pricing */}
        <section className="mb-8">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${module2Decisions.length > 0 ? "bg-[var(--primary)]" : "bg-gray-300"}`}>4</span>
            <span className={module2Decisions.length > 0 ? "" : "text-[var(--text-muted)]"}>Customer Insights & Pricing</span>
          </h2>
          {module2Decisions.length > 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-6 space-y-3">
              {module2Decisions.map((d, i) => (
                <div key={i}>
                  <p className="text-xs text-[var(--text-muted)]">{d.lessonTitle}</p>
                  <p className="text-sm text-[var(--text-primary)]">{d.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-subtle)]/50 p-6">
              <p className="text-xs text-[var(--text-muted)]">{"You'll fill this in during Module 2 lessons."}</p>
            </div>
          )}
        </section>

        {/* Section 5: The Pitch */}
        <section className="mb-8">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${pitch?.pitch_text ? "bg-[var(--accent)]" : "bg-gray-300"}`}>5</span>
            <span className={pitch?.pitch_text ? "" : "text-[var(--text-muted)]"}>The Pitch</span>
          </h2>
          {pitch?.pitch_text ? (
            <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-6">
              <p className="text-xl font-medium font-[family-name:var(--font-display)] text-[var(--text-primary)] leading-relaxed italic">
                &ldquo;{pitch.pitch_text}&rdquo;
              </p>
              <p className="mt-3 text-[13px] font-medium tracking-wide text-[var(--text-muted)]">— {studentName}, Founder of {businessIdea.name}</p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-subtle)]/50 p-6">
              <p className="text-xs text-[var(--text-muted)]">Your elevator pitch appears here after completing Module 2. This is the capstone of your business plan.</p>
            </div>
          )}
        </section>

        {/* Progress footer */}
        <div className="mt-10 pt-6 border-t border-[var(--border)] flex items-center justify-between">
          <div className="text-xs text-[var(--text-muted)]">
            {completedCount}/{allLessons.length} lessons · Adaptable by VentureLab
          </div>
          <div className="flex gap-3">
            <Link
              href="/card"
              className="text-xs font-medium text-[var(--primary)] hover:underline"
            >
              Business Card
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-medium text-[var(--primary)] hover:underline"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
