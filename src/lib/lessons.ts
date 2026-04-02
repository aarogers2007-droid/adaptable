import type { Lesson, Profile, StudentProgress } from "./types";

/**
 * Replace personalization tokens in lesson content.
 * Tokens: {{niche}}, {{business_name}}, {{target_customer}}, {{pricing}}
 */
export function renderLesson(template: string, profile: Profile): string {
  const idea = profile.business_idea;
  if (!idea) return template;

  return template
    .replace(/\{\{niche\}\}/g, idea.niche)
    .replace(/\{\{business_name\}\}/g, idea.name)
    .replace(/\{\{target_customer\}\}/g, idea.target_customer)
    .replace(/\{\{pricing\}\}/g, idea.revenue_model)
    .replace(/\{\{revenue_model\}\}/g, idea.revenue_model);
}

/**
 * Determine which lesson a student should see next (gated linear progression).
 * Returns the first lesson where progress is not 'completed'.
 */
export function getNextLesson(
  lessons: Lesson[],
  progress: StudentProgress[]
): Lesson | null {
  const completedIds = new Set(
    progress.filter((p) => p.status === "completed").map((p) => p.lesson_id)
  );

  // Lessons sorted by module then lesson sequence
  const sorted = [...lessons].sort((a, b) => {
    if (a.module_sequence !== b.module_sequence)
      return a.module_sequence - b.module_sequence;
    return a.lesson_sequence - b.lesson_sequence;
  });

  return sorted.find((l) => !completedIds.has(l.id)) ?? null;
}

/**
 * Check if a lesson is unlocked for a student.
 * A lesson is unlocked if all previous lessons are completed.
 */
export function isLessonUnlocked(
  lesson: Lesson,
  allLessons: Lesson[],
  progress: StudentProgress[]
): boolean {
  const completedIds = new Set(
    progress.filter((p) => p.status === "completed").map((p) => p.lesson_id)
  );

  const sorted = [...allLessons].sort((a, b) => {
    if (a.module_sequence !== b.module_sequence)
      return a.module_sequence - b.module_sequence;
    return a.lesson_sequence - b.lesson_sequence;
  });

  for (const l of sorted) {
    if (l.id === lesson.id) return true;
    if (!completedIds.has(l.id)) return false;
  }

  return false;
}

/**
 * Calculate progress percentage.
 * Milestones: ikigai done + each completed lesson.
 */
export function calculateProgress(
  profile: Profile,
  totalLessons: number,
  completedLessonCount: number
): { percentage: number; completed: number; total: number } {
  // Milestones: ikigai (1) + all lessons
  const ikigaiDone = profile.business_idea ? 1 : 0;
  const total = 1 + totalLessons;
  const completed = ikigaiDone + completedLessonCount;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { percentage, completed, total };
}
