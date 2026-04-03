import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { renderLesson, isLessonUnlocked } from "@/lib/lessons";
import type { Profile, Lesson, StudentProgress } from "@/lib/types";
import Link from "next/link";
import LessonExercise from "./LessonExercise";

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

  if (!isLessonUnlocked(lesson, allLessons, allProgress)) {
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

  const content = renderLesson(lesson.content_template, profile);

  // Find next lesson
  const sorted = [...allLessons].sort((a, b) => {
    if (a.module_sequence !== b.module_sequence) return a.module_sequence - b.module_sequence;
    return a.lesson_sequence - b.lesson_sequence;
  });
  const currentIdx = sorted.findIndex((l) => l.id === lesson.id);
  const nextLesson = currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null;
  const isCompleted = progress?.status === "completed";

  // Extract exercise section from content (everything after "## Your Exercise")
  const exerciseSplit = content.split(/## Your Exercise/i);
  const lessonContent = exerciseSplit[0];
  const exercisePrompt = exerciseSplit[1]?.trim() ?? "";

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[800px] items-center gap-4 px-6 py-3">
          <Link href="/dashboard" className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--primary)]">
            Adaptable
          </Link>
          <Link href="/lessons" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            ← All Lessons
          </Link>
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            {lesson.module_name} · Lesson {lesson.lesson_sequence}
          </span>
        </div>
      </nav>

      <article className="mx-auto max-w-[700px] px-6 py-10">
        {/* Lesson content */}
        <div
          className="prose prose-gray max-w-none
            [&_h1]:font-[family-name:var(--font-display)] [&_h1]:text-3xl [&_h1]:font-bold
            [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8
            [&_p]:text-[var(--text-secondary)] [&_p]:leading-relaxed
            [&_li]:text-[var(--text-secondary)]
            [&_strong]:text-[var(--text-primary)]"
          dangerouslySetInnerHTML={{
            __html: lessonContent
              .split("\n")
              .map((line) => {
                const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
                const fmt = (s: string) => s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>");
                const escaped = esc(line);
                if (escaped.startsWith("# ")) return `<h1>${fmt(escaped.slice(2))}</h1>`;
                if (escaped.startsWith("## ")) return `<h2>${fmt(escaped.slice(3))}</h2>`;
                if (escaped.startsWith("- ")) return `<li>${fmt(escaped.slice(2))}</li>`;
                if (escaped.match(/^\d+\. /)) return `<li>${fmt(escaped.replace(/^\d+\. /, ""))}</li>`;
                if (escaped.trim() === "") return "<br/>";
                return `<p>${fmt(escaped)}</p>`;
              })
              .join("\n"),
          }}
        />

        {/* Exercise */}
        <LessonExercise
          lessonId={lesson.id}
          lessonTitle={lesson.title}
          progressId={progress?.id ?? ""}
          exercisePrompt={exercisePrompt}
          isCompleted={isCompleted}
          nextLessonId={nextLesson?.id ?? null}
          previousResponse={(progress?.artifacts as { response?: string })?.response ?? ""}
          businessName={profile.business_idea.name}
          niche={profile.business_idea.niche}
        />
      </article>
    </main>
  );
}
