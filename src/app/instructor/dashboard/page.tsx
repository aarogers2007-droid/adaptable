import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TeacherAlert, BusinessIdea, IkigaiResult } from "@/lib/types";
import { checkInactiveAndStuck, checkClassStrugglePatterns } from "@/lib/teacher-alerts";
import DashboardClient from "./DashboardClient";
import type { ClassData } from "./DashboardClient";
import type { StudentRow } from "./StudentTable";
import type { FeedItem } from "./LiveFeed";
import type { AnalyticsData } from "./ClassAnalytics";

export const dynamic = "force-dynamic";

export default async function InstructorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify instructor role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, org_id")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    (profile.role !== "instructor" && profile.role !== "org_admin")
  ) {
    redirect("/dashboard");
  }

  // Get classes: org_admins see all classes in their org, instructors see their own
  let classQuery = supabase
    .from("classes")
    .select("id, name, description, instructor_id")
    .order("created_at", { ascending: true });

  if (profile.role === "org_admin" && profile.org_id) {
    classQuery = classQuery.eq("org_id", profile.org_id);
  } else {
    classQuery = classQuery.eq("instructor_id", user.id);
  }

  const { data: classes } = await classQuery;

  // Get total lessons count
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, title, module_sequence, lesson_sequence")
    .order("module_sequence")
    .order("lesson_sequence");

  const totalLessons = allLessons?.length ?? 0;

  // Check for inactive/stuck students on dashboard load
  for (const cls of classes ?? []) {
    await checkInactiveAndStuck(supabase, cls.id);
  }

  // Build class data
  const classDataArray: ClassData[] = [];

  for (const cls of classes ?? []) {
    // Get enrollments
    const { data: enrollments } = await supabase
      .from("class_enrollments")
      .select("student_id, enrolled_at")
      .eq("class_id", cls.id);

    const studentIds = (enrollments ?? []).map((e) => e.student_id);
    const enrolledAtMap = new Map(
      (enrollments ?? []).map((e) => [e.student_id, e.enrolled_at])
    );

    // Check for class-wide struggle patterns (30%+ stuck on same lesson)
    await checkClassStrugglePatterns(supabase, cls.id, studentIds);

    // Get invite code for this class
    const { data: inviteCodeRow } = await supabase
      .from("invite_codes")
      .select("code")
      .eq("class_id", cls.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Get student profiles
    let studentProfiles: {
      id: string;
      full_name: string | null;
      email: string | null;
      business_idea: BusinessIdea | null;
      ikigai_result: IkigaiResult | null;
    }[] = [];

    if (studentIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, business_idea, ikigai_result")
        .in("id", studentIds);

      studentProfiles = (profiles ?? []) as typeof studentProfiles;
    }

    // Get all student_progress for these students
    let allProgress: {
      student_id: string;
      lesson_id: string;
      status: string;
      completed_at: string | null;
      updated_at: string;
      artifacts: Record<string, unknown> | null;
    }[] = [];

    if (studentIds.length > 0) {
      const { data: progress } = await supabase
        .from("student_progress")
        .select("student_id, lesson_id, status, completed_at, updated_at, artifacts")
        .in("student_id", studentIds);

      allProgress = (progress ?? []) as typeof allProgress;
    }

    // Get last activity (from ai_usage_log) per student
    const lastActivityMap = new Map<string, string>();
    if (studentIds.length > 0) {
      const { data: usageLogs } = await supabase
        .from("ai_usage_log")
        .select("student_id, created_at")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false });

      for (const log of usageLogs ?? []) {
        if (log.student_id && !lastActivityMap.has(log.student_id)) {
          lastActivityMap.set(log.student_id, log.created_at);
        }
      }
    }

    // Build student rows
    const lessonMap = new Map(
      (allLessons ?? []).map((l) => [
        l.id,
        {
          title: l.title,
          moduleSequence: l.module_sequence,
          lessonSequence: l.lesson_sequence,
        },
      ])
    );

    const students: StudentRow[] = studentProfiles.map((sp) => {
      const studentProgress = allProgress.filter((p) => p.student_id === sp.id);
      const completedLessons = studentProgress.filter(
        (p) => p.status === "completed"
      ).length;

      // Build lesson-by-lesson progress
      const lessonProgress = studentProgress
        .map((p) => {
          const lesson = lessonMap.get(p.lesson_id);
          return {
            lessonTitle: lesson?.title ?? "Unknown",
            moduleSequence: lesson?.moduleSequence ?? 0,
            lessonSequence: lesson?.lessonSequence ?? 0,
            status: p.status,
            completedAt: p.completed_at,
          };
        })
        .sort(
          (a, b) =>
            a.moduleSequence - b.moduleSequence ||
            a.lessonSequence - b.lessonSequence
        );

      // Extract learning profile from artifacts if available
      let learningProfile: Record<string, string> | null = null;
      for (const p of studentProgress) {
        if (p.artifacts && typeof p.artifacts === "object") {
          const arts = p.artifacts as Record<string, unknown>;
          if (arts.learning_style || arts.pace || arts.register) {
            learningProfile = {};
            for (const key of [
              "learning_style",
              "pace",
              "detail_level",
              "motivation",
              "register",
              "emotion",
            ]) {
              if (arts[key] && typeof arts[key] === "string") {
                learningProfile[key] = arts[key] as string;
              }
            }
            break;
          }
        }
      }

      return {
        id: sp.id,
        full_name: sp.full_name,
        email: sp.email,
        enrolled_at: enrolledAtMap.get(sp.id) ?? "",
        business_idea: sp.business_idea,
        ikigai_result: sp.ikigai_result,
        completedLessons,
        totalLessons,
        lastActive: lastActivityMap.get(sp.id) ?? null,
        lessonProgress,
        learningProfile,
      };
    });

    // Build activity feed
    const feedItems: FeedItem[] = [];

    if (studentIds.length > 0) {
      // Student progress events
      for (const p of allProgress) {
        const sp = studentProfiles.find((s) => s.id === p.student_id);
        const lesson = lessonMap.get(p.lesson_id);
        if (!sp || !lesson) continue;

        if (p.status === "completed" && p.completed_at) {
          feedItems.push({
            id: `complete-${p.student_id}-${p.lesson_id}`,
            studentName: sp.full_name || "Unnamed",
            action: "completed",
            detail: `${lesson.moduleSequence}.${lesson.lessonSequence} ${lesson.title}`,
            type: "lesson_completed",
            timestamp: p.completed_at,
          });
        } else if (p.status === "in_progress") {
          feedItems.push({
            id: `started-${p.student_id}-${p.lesson_id}`,
            studentName: sp.full_name || "Unnamed",
            action: "started",
            detail: `${lesson.moduleSequence}.${lesson.lessonSequence} ${lesson.title}`,
            type: "lesson_started",
            timestamp: p.updated_at,
          });
        }
      }

      // Ikigai completions
      for (const sp of studentProfiles) {
        if (sp.ikigai_result) {
          feedItems.push({
            id: `ikigai-${sp.id}`,
            studentName: sp.full_name || "Unnamed",
            action: "completed",
            detail: "Ikigai Discovery",
            type: "ikigai_completed",
            timestamp: enrolledAtMap.get(sp.id) ?? "",
          });
        }
      }

      // Recent AI chat activity (last 100)
      const { data: recentChats } = await supabase
        .from("ai_usage_log")
        .select("student_id, feature, created_at")
        .in("student_id", studentIds)
        .in("feature", ["lesson-chat", "guide", "chat"])
        .order("created_at", { ascending: false })
        .limit(100);

      const studentNameMap = new Map(
        studentProfiles.map((sp) => [sp.id, sp.full_name || "Unnamed"])
      );

      for (const chat of recentChats ?? []) {
        if (chat.student_id) {
          feedItems.push({
            id: `chat-${chat.student_id}-${chat.created_at}`,
            studentName: studentNameMap.get(chat.student_id) ?? "Unnamed",
            action: "had AI conversation in",
            detail: chat.feature.replace(/-/g, " "),
            type: "chat_activity",
            timestamp: chat.created_at,
          });
        }
      }
    }

    // Sort feed by timestamp descending
    feedItems.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Get alerts for this class
    let classAlerts: (TeacherAlert & { student_name: string })[] = [];
    {
      const { data: rawAlerts } = await supabase
        .from("teacher_alerts")
        .select("*")
        .eq("class_id", cls.id)
        .eq("acknowledged", false)
        .order("created_at", { ascending: false })
        .limit(50);

      if (rawAlerts && rawAlerts.length > 0) {
        const alertStudentIds = [
          ...new Set(rawAlerts.map((a) => a.student_id)),
        ];
        const { data: alertProfiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", alertStudentIds);

        const nameMap = new Map(
          (alertProfiles ?? []).map((p) => [
            p.id,
            (p.full_name as string) ?? "Unknown",
          ])
        );

        classAlerts = (rawAlerts as TeacherAlert[]).map((a) => ({
          ...a,
          student_name: nameMap.get(a.student_id) ?? "Unknown",
        }));
      }
    }

    // Build analytics
    const completedStudents = students.filter(
      (s) => s.completedLessons === totalLessons && totalLessons > 0
    ).length;
    const completionRate =
      students.length > 0
        ? Math.round((completedStudents / students.length) * 100)
        : 0;
    const avgLessonsCompleted =
      students.length > 0
        ? students.reduce((sum, s) => sum + s.completedLessons, 0) /
          students.length
        : 0;

    // Avg time per lesson (days between start and completion)
    const completedWithTimes = allProgress.filter(
      (p) => p.status === "completed" && p.completed_at
    );
    let avgTimePerLesson = "N/A";
    if (completedWithTimes.length > 0) {
      // Use updated_at - created_at approximation isn't available directly,
      // but we can compute from completed_at spread
      const totalDays = completedWithTimes.reduce((sum, p) => {
        if (!p.completed_at) return sum;
        const updated = new Date(p.updated_at).getTime();
        const completed = new Date(p.completed_at).getTime();
        // Approximate: time between first interaction and completion
        const diff = Math.abs(completed - updated);
        return sum + diff / (1000 * 60 * 60 * 24);
        }, 0);
      const avg = totalDays / completedWithTimes.length;
      if (avg < 1) {
        avgTimePerLesson = "< 1 day";
      } else {
        avgTimePerLesson = `${avg.toFixed(1)} days`;
      }
    }

    // Active this week
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const activeThisWeek = students.filter(
      (s) => s.lastActive && new Date(s.lastActive).getTime() > oneWeekAgo
    ).length;

    // Student progress for analytics
    const studentProgressBars = students.map((s) => ({
      name: s.full_name || "Unnamed",
      completed: s.completedLessons,
      total: totalLessons,
    }));

    // Where students get stuck
    const stuckByLesson = new Map<string, number>();
    for (const p of allProgress) {
      if (p.status === "in_progress") {
        const lesson = lessonMap.get(p.lesson_id);
        if (lesson) {
          const key = `${lesson.moduleSequence}.${lesson.lessonSequence} ${lesson.title}`;
          stuckByLesson.set(key, (stuckByLesson.get(key) ?? 0) + 1);
        }
      }
    }
    const stuckPoints = [...stuckByLesson.entries()]
      .map(([lessonTitle, count]) => ({ lessonTitle, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Avg speed by lesson
    const completionsByLesson = new Map<
      string,
      { totalDays: number; count: number }
    >();
    for (const p of completedWithTimes) {
      const lesson = lessonMap.get(p.lesson_id);
      if (!lesson || !p.completed_at) continue;
      const key = `${lesson.moduleSequence}.${lesson.lessonSequence} ${lesson.title}`;
      const existing = completionsByLesson.get(key) ?? {
        totalDays: 0,
        count: 0,
      };
      const diff = Math.abs(
        new Date(p.completed_at).getTime() -
          new Date(p.updated_at).getTime()
      );
      existing.totalDays += diff / (1000 * 60 * 60 * 24);
      existing.count += 1;
      completionsByLesson.set(key, existing);
    }
    const avgSpeedByLesson = [...completionsByLesson.entries()]
      .map(([lessonTitle, { totalDays, count }]) => ({
        lessonTitle,
        avgDays: count > 0 ? totalDays / count : 0,
      }))
      .sort((a, b) => {
        // Sort by lesson sequence
        const aNum = parseFloat(a.lessonTitle.split(" ")[0]);
        const bNum = parseFloat(b.lessonTitle.split(" ")[0]);
        return aNum - bNum;
      });

    const analytics: AnalyticsData = {
      completionRate,
      avgLessonsCompleted,
      avgTimePerLesson,
      activeThisWeek,
      totalStudents: students.length,
      studentProgress: studentProgressBars,
      stuckPoints,
      avgSpeedByLesson,
    };

    classDataArray.push({
      id: cls.id,
      name: cls.name,
      description: cls.description ?? null,
      inviteCode: inviteCodeRow?.code ?? null,
      students,
      feedItems,
      alerts: classAlerts,
      analytics,
    });
  }

  return (
    <main className="min-h-screen bg-[var(--bg-subtle)]">
      <DashboardClient classes={classDataArray} totalLessons={totalLessons} />
    </main>
  );
}
