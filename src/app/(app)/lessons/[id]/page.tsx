import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLessonUnlocked } from "@/lib/lessons";
import { getLessonPlan } from "@/lib/lesson-plans";
import type { Profile, Lesson, StudentProgress } from "@/lib/types";
import LessonConversation from "./LessonConversation";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, lessonRes, allLessonsRes, allProgressRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("lessons").select("*").eq("id", id).single(),
    supabase.from("lessons").select("*").order("module_sequence").order("lesson_sequence"),
    supabase.from("student_progress").select("*").eq("student_id", user.id),
  ]);

  const profile = profileRes.data as unknown as Profile | null;
  if (!profile?.business_idea) redirect("/onboarding");

  const lesson = lessonRes.data as unknown as Lesson | null;
  if (!lesson) notFound();

  const allLessons = (allLessonsRes.data ?? []) as unknown as Lesson[];
  const allProgress = (allProgressRes.data ?? []) as unknown as StudentProgress[];

  // Admins bypass lesson gating
  const isAdmin = profile.role === "org_admin";
  if (!isAdmin && !isLessonUnlocked(lesson, allLessons, allProgress)) {
    redirect("/lessons");
  }

  // Get or create progress record
  let progress = allProgress.find((p) => p.lesson_id === lesson.id) ?? null;
  if (!progress) {
    const { data } = await supabase
      .from("student_progress")
      .insert({ student_id: user.id, lesson_id: lesson.id, status: "in_progress" })
      .select()
      .single();
    progress = data as unknown as StudentProgress;
  } else if (progress.status === "not_started") {
    await supabase
      .from("student_progress")
      .update({ status: "in_progress" })
      .eq("id", progress.id);
  }

  // Find next lesson
  const sorted = [...allLessons].sort((a, b) => {
    if (a.module_sequence !== b.module_sequence) return a.module_sequence - b.module_sequence;
    return a.lesson_sequence - b.lesson_sequence;
  });
  const currentIdx = sorted.findIndex((l) => l.id === lesson.id);
  const nextLesson = currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null;
  const isCompleted = progress?.status === "completed";

  // Get lesson plan for conversational flow
  const plan = getLessonPlan(lesson.module_sequence, lesson.lesson_sequence);

  // Personalize the opener
  const studentName = profile.full_name?.split(" ")[0] ?? "there";
  const opener = plan
    ? plan.opener
        .replace(/\{\{name\}\}/g, studentName)
        .replace(/\{\{niche\}\}/g, profile.business_idea.niche)
        .replace(/\{\{business_name\}\}/g, profile.business_idea.name)
        .replace(/\{\{target_customer\}\}/g, profile.business_idea.target_customer)
    : `Hey ${studentName}! Let's work through "${lesson.title}" together. This is all about ${profile.business_idea.name}. Ready to start?`;

  // Get existing conversation from artifacts
  const artifacts = (progress?.artifacts ?? {}) as Record<string, unknown>;
  const existingConversation = (artifacts.conversation ?? []) as { role: "user" | "assistant"; content: string }[];
  const checkpointsReached = (artifacts.checkpoints_reached ?? []) as string[];

  const objective = plan?.objective ?? `Complete the "${lesson.title}" lesson`;

  return (
    <LessonConversation
      lessonId={lesson.id}
      lessonTitle={lesson.title}
      moduleName={lesson.module_name}
      lessonSequence={lesson.lesson_sequence}
      moduleSequence={lesson.module_sequence}
      progressId={progress?.id ?? ""}
      isCompleted={isCompleted}
      nextLessonId={nextLesson?.id ?? null}
      initialMessages={existingConversation}
      initialCheckpoints={checkpointsReached.length}
      totalCheckpoints={plan?.checkpoints.length ?? 3}
      opener={opener}
      objective={objective}
      isAdmin={isAdmin}
      studentName={profile.full_name ?? ""}
    />
  );
}
