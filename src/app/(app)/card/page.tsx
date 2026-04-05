import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudentAchievements, ACHIEVEMENT_MAP } from "@/lib/achievements";
import type { Profile, Lesson, StudentProgress } from "@/lib/types";
import AppNav from "@/components/ui/AppNav";
import { getCardConfig } from "./card-actions";
import BusinessCardClient from "./BusinessCardClient";

export default async function CardPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const [profileRes, lessonsRes, progressRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("lessons").select("*").order("module_sequence").order("lesson_sequence"),
      supabase.from("student_progress").select("*").eq("student_id", user.id),
    ]);

    const profile = profileRes.data as unknown as Profile | null;
    if (!profile?.business_idea) redirect("/onboarding");

    const lessons = (lessonsRes.data ?? []) as unknown as Lesson[];
    const progress = (progressRes.data ?? []) as unknown as StudentProgress[];

    const completedLessonIds = new Set(
      progress.filter((p) => p.status === "completed").map((p) => p.lesson_id)
    );

    // Build lesson lookup by module_sequence + lesson_sequence to handle multi-module correctly
    const lessonByPos = new Map(
      lessons.map((l) => [`${l.module_sequence}-${l.lesson_sequence}`, l])
    );

    const isLessonCompleteByPos = (mod: number, seq: number): boolean => {
      const lesson = lessonByPos.get(`${mod}-${seq}`);
      return lesson ? completedLessonIds.has(lesson.id) : false;
    };

    const completedCount = progress.filter((p) => p.status === "completed").length;
    const totalLessons = lessons.length;

    const PREVIEW_MODE = false;

    // Compute unlocks (matches lesson plan: Module 1 has lessons 1-4, Module 2 has lessons 1-4)
    const hasBase = PREVIEW_MODE || !!profile.ikigai_result;
    const hasTargetCustomer = PREVIEW_MODE || isLessonCompleteByPos(1, 2); // Niche Validation
    const hasHolographic = PREVIEW_MODE || isLessonCompleteByPos(1, 4); // Target Customer
    const hasBack = PREVIEW_MODE || isLessonCompleteByPos(2, 1); // Customer Interview
    const hasMetallic = PREVIEW_MODE || isLessonCompleteByPos(2, 3); // Set Your Price
    const isFounder = PREVIEW_MODE || (totalLessons > 0 && completedCount >= totalLessons);

    // Fetch card config
    const cardConfig = await getCardConfig(user.id);

    // Calculate total characters written (for font unlocks)
    let totalCharsWritten = 0;
    for (const p of progress) {
      const artifacts = (p as unknown as { artifacts: Record<string, unknown> | null }).artifacts;
      if (artifacts?.conversation) {
        const conv = artifacts.conversation as { role: string; content: string }[];
        for (const msg of conv) {
          if (msg.role === "user") totalCharsWritten += msg.content.length;
        }
      }
    }

    // Fetch achievements
    const admin = createAdminClient();
    const allEarned = await getStudentAchievements(admin, user.id);
    const earnedDisplay = allEarned.map((e) => {
      const def = ACHIEVEMENT_MAP.get(e.achievement_id);
      return {
        id: e.achievement_id,
        name: def?.name ?? e.achievement_id,
        icon: def?.icon ?? "",
        tier: e.tier,
      };
    });

    return (
      <main className="min-h-screen bg-[var(--bg-subtle)]">
        <AppNav
          isAdmin={profile.role === "org_admin"}
          studentName={profile.full_name || profile.email || undefined}
        />
        <BusinessCardClient
          businessName={profile.business_idea.name}
          niche={profile.business_idea.niche}
          studentName={profile.full_name?.split(" ")[0] ?? "Student"}
          targetCustomer={hasTargetCustomer ? profile.business_idea.target_customer : undefined}
          config={cardConfig}
          unlocks={{
            hasBase,
            hasTargetCustomer,
            hasHolographic,
            hasBack,
            hasMetallic,
            isFounder,
          }}
          achievements={earnedDisplay}
          totalCharsWritten={totalCharsWritten}
        />
      </main>
    );
  } catch (error) {
    console.error("[card] Page error:", error);
    return (
      <main className="min-h-screen bg-[var(--bg-subtle)] flex items-center justify-center">
        <div className="max-w-md p-6 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)] mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            We couldn&apos;t load your business card. Try refreshing the page.
          </p>
          <a href="/dashboard" className="text-sm font-medium text-[var(--primary)] hover:underline">
            Back to Dashboard
          </a>
        </div>
      </main>
    );
  }
}
