import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get all lessons
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, module_name, module_sequence, lesson_sequence, model_override")
    .order("module_sequence")
    .order("lesson_sequence");

  if (!lessons || lessons.length === 0) {
    console.log("No lessons found");
    return;
  }

  // Get all student progress
  const { data: progress } = await supabase
    .from("student_progress")
    .select("lesson_id, student_id, status, completed_at, created_at, artifacts");

  // Get all AI usage for lessons
  const { data: usage } = await supabase
    .from("ai_usage_log")
    .select("lesson_id, student_id, input_tokens, output_tokens, estimated_cost_usd, response_length, student_response_time_ms, session_duration_seconds, completion_flag, model")
    .eq("feature", "guide")
    .not("lesson_id", "is", null);

  // Get total student count
  const { count: totalStudents } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "student");

  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║              ADAPTABLE LESSON CONFIDENCE SCORECARD              ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");
  console.log(`\nTotal students: ${totalStudents}`);
  console.log(`Total lessons: ${lessons.length}`);
  console.log(`Total progress rows: ${(progress ?? []).length}`);
  console.log(`Total AI usage rows: ${(usage ?? []).length}\n`);

  const progressByLesson = new Map<string, typeof progress>();
  for (const p of (progress ?? [])) {
    const arr = progressByLesson.get(p.lesson_id) ?? [];
    arr.push(p);
    progressByLesson.set(p.lesson_id, arr);
  }

  const usageByLesson = new Map<string, typeof usage>();
  for (const u of (usage ?? [])) {
    if (!u.lesson_id) continue;
    const arr = usageByLesson.get(u.lesson_id) ?? [];
    arr.push(u);
    usageByLesson.set(u.lesson_id, arr);
  }

  console.log("─".repeat(120));
  console.log(
    "Lesson".padEnd(40) +
    "Model".padEnd(12) +
    "Started".padEnd(9) +
    "Done".padEnd(6) +
    "Rate".padEnd(7) +
    "AvgExch".padEnd(9) +
    "AvgDur".padEnd(9) +
    "AvgRT".padEnd(9) +
    "AvgCost".padEnd(10) +
    "Score"
  );
  console.log("─".repeat(120));

  let overallScore = 0;
  let scoredLessons = 0;

  for (const lesson of lessons) {
    const prog = progressByLesson.get(lesson.id) ?? [];
    const usg = usageByLesson.get(lesson.id) ?? [];

    const started = new Set(prog.map(p => p.student_id)).size;
    const completed = prog.filter(p => p.status === "completed").length;
    const completionRate = started > 0 ? completed / started : 0;

    // Exchanges per student
    const exchangesByStudent = new Map<string, number>();
    for (const u of usg) {
      if (u.input_tokens > 0) { // skip reservation rows
        exchangesByStudent.set(u.student_id, (exchangesByStudent.get(u.student_id) ?? 0) + 1);
      }
    }
    const avgExchanges = exchangesByStudent.size > 0
      ? [...exchangesByStudent.values()].reduce((a, b) => a + b, 0) / exchangesByStudent.size
      : 0;

    // Session duration
    const durations = usg.filter(u => u.session_duration_seconds && u.session_duration_seconds > 0).map(u => u.session_duration_seconds!);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    // Response times
    const rts = usg.filter(u => u.student_response_time_ms && u.student_response_time_ms > 0 && u.student_response_time_ms < 600000).map(u => u.student_response_time_ms!);
    const avgRT = rts.length > 0 ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;

    // Cost
    const totalCost = usg.reduce((sum, u) => sum + (u.estimated_cost_usd ?? 0), 0);
    const avgCost = started > 0 ? totalCost / started : 0;

    // Model
    const model = lesson.model_override ? "mini" : "sonnet";

    // Confidence score (0-100)
    // Factors:
    //   - Completion rate (40% weight) — higher is better
    //   - Avg exchanges (20% weight) — 5-15 is ideal, too few or too many is bad
    //   - Avg response time (20% weight) — 15-60s is ideal engagement
    //   - Has been tested at all (20% weight) — no data = 0
    let score = 0;
    if (started > 0) {
      // Completion rate score (0-40)
      score += completionRate * 40;

      // Exchange score (0-20): ideal is 5-15 exchanges
      if (avgExchanges >= 5 && avgExchanges <= 15) {
        score += 20;
      } else if (avgExchanges > 0) {
        score += Math.max(0, 20 - Math.abs(avgExchanges - 10) * 2);
      }

      // Response time score (0-20): ideal is 15-60s
      if (avgRT > 0) {
        const rtSeconds = avgRT / 1000;
        if (rtSeconds >= 15 && rtSeconds <= 60) {
          score += 20;
        } else if (rtSeconds > 0) {
          score += Math.max(0, 20 - Math.abs(rtSeconds - 37.5) * 0.5);
        }
      }

      // Tested score (0-20): at least 3 students = full marks
      score += Math.min(20, (started / 3) * 20);
    }

    const scoreLabel = started === 0 ? "NO DATA" :
      score >= 80 ? `${score.toFixed(0)} ✓` :
      score >= 60 ? `${score.toFixed(0)} ~` :
      score >= 40 ? `${score.toFixed(0)} ⚠` :
      `${score.toFixed(0)} ✗`;

    const title = `M${lesson.module_sequence}L${lesson.lesson_sequence} ${lesson.title}`;

    console.log(
      title.slice(0, 39).padEnd(40) +
      model.padEnd(12) +
      String(started).padEnd(9) +
      String(completed).padEnd(6) +
      (started > 0 ? `${(completionRate * 100).toFixed(0)}%` : "—").padEnd(7) +
      (avgExchanges > 0 ? avgExchanges.toFixed(1) : "—").padEnd(9) +
      (avgDuration > 0 ? `${Math.round(avgDuration / 60)}min` : "—").padEnd(9) +
      (avgRT > 0 ? `${(avgRT / 1000).toFixed(0)}s` : "—").padEnd(9) +
      (avgCost > 0 ? `$${avgCost.toFixed(3)}` : "—").padEnd(10) +
      scoreLabel
    );

    if (started > 0) {
      overallScore += score;
      scoredLessons++;
    }
  }

  console.log("─".repeat(120));

  if (scoredLessons > 0) {
    const avg = overallScore / scoredLessons;
    console.log(`\nOverall confidence: ${avg.toFixed(0)}/100 across ${scoredLessons} tested lessons`);
    console.log(`Untested lessons: ${lessons.length - scoredLessons}`);
  } else {
    console.log("\nNo lessons have been tested yet.");
  }

  // Checkpoints analysis
  console.log("\n\n── CHECKPOINT ANALYSIS ──\n");
  for (const lesson of lessons) {
    const prog = progressByLesson.get(lesson.id) ?? [];
    const withArtifacts = prog.filter(p => p.artifacts);

    if (withArtifacts.length === 0) continue;

    let totalCheckpoints = 0;
    let reachedCheckpoints = 0;

    for (const p of withArtifacts) {
      const artifacts = p.artifacts as Record<string, unknown> | null;
      if (!artifacts) continue;
      const reached = (artifacts.checkpoints_reached ?? []) as string[];
      reachedCheckpoints += reached.length;
      // We don't know total checkpoints from progress, but we can count unique ones
    }

    if (reachedCheckpoints > 0) {
      console.log(`  M${lesson.module_sequence}L${lesson.lesson_sequence} ${lesson.title}: ${reachedCheckpoints} checkpoints reached across ${withArtifacts.length} sessions`);
    }
  }

  // Conversation quality sample
  console.log("\n\n── CONVERSATION QUALITY SAMPLE ──\n");
  console.log("Sampling first and last messages from completed lessons to check Socratic quality...\n");

  for (const lesson of lessons.slice(0, 5)) {
    const prog = progressByLesson.get(lesson.id) ?? [];
    const completedProg = prog.filter(p => p.status === "completed" && p.artifacts);

    if (completedProg.length === 0) continue;

    const sample = completedProg[0];
    const artifacts = sample.artifacts as Record<string, unknown> | null;
    if (!artifacts) continue;

    const conversation = (artifacts.conversation ?? []) as { role: string; content: string }[];
    if (conversation.length < 2) continue;

    const firstAI = conversation.find(m => m.role === "assistant");
    const lastAI = [...conversation].reverse().find(m => m.role === "assistant");

    console.log(`  M${lesson.module_sequence}L${lesson.lesson_sequence} ${lesson.title}`);
    if (firstAI) {
      console.log(`    OPENER: "${firstAI.content.slice(0, 150)}..."`);
    }
    if (lastAI && lastAI !== firstAI) {
      console.log(`    CLOSER: "${lastAI.content.slice(0, 150)}..."`);
    }

    // Check for Socratic violations
    const violations: string[] = [];
    for (const m of conversation.filter(m => m.role === "assistant")) {
      const lower = m.content.toLowerCase();
      if (lower.includes("great job!") || lower.includes("awesome!") || lower.includes("perfect!")) {
        violations.push("cheerleading detected");
        break;
      }
      if (lower.includes("here's what you should do") || lower.includes("you should try")) {
        violations.push("giving answers instead of asking");
        break;
      }
    }
    if (violations.length > 0) {
      console.log(`    ⚠ VIOLATIONS: ${violations.join(", ")}`);
    } else {
      console.log(`    ✓ No obvious Socratic violations`);
    }
    console.log();
  }

  console.log("══════════════════════════════════════════════════════════════════");
}

main().catch(console.error);
