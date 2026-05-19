import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) { const m = line.match(/^([^#=]+)=(.*)$/); if(m) process.env[m[1].trim()]=m[2].trim(); }
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  console.log("=== CURRENT DATABASE SIZE ===\n");

  const tables = [
    "profiles", "ai_usage_log", "student_progress", "student_achievements",
    "ai_conversations", "daily_checkins", "lesson_decisions", "business_pitches",
    "mentor_checkins", "teacher_alerts", "student_scenario_sessions", "student_badges",
    "lesson_ratings", "student_ideas", "feedback", "support_conversations",
    "class_enrollments", "classes", "organizations", "scenarios",
    "founder_reflections", "invention_sessions",
  ];

  let totalRows = 0;
  for (const table of tables) {
    const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
    const c = count ?? 0;
    totalRows += c;
    if (c > 0) console.log(`  ${table}: ${c.toLocaleString()} rows`);
  }

  console.log(`\n  TOTAL: ${totalRows.toLocaleString()} rows`);

  // Project at 10,000 students
  console.log("\n=== PROJECTED AT 10,000 STUDENTS ===\n");
  console.log("  profiles: 10,000");
  console.log("  ai_usage_log: ~2,000,000 (10K students × 22 lessons × ~10 exchanges)");
  console.log("  student_progress: ~220,000 (10K × 22 lessons)");
  console.log("  student_achievements: ~50,000 (10K × ~5 avg achievements)");
  console.log("  student_ideas: ~220,000 (one per lesson completion)");
  console.log("  lesson_ratings: ~10,000 (one per student)");
  console.log("  student_scenario_sessions: ~20,000 (10K × ~2 scenarios)");
  console.log("  class_enrollments: ~10,000");
  console.log("  daily_checkins: ~100,000 (10K × ~10 days active)");
  console.log("  PROJECTED TOTAL: ~2,640,000 rows");

  console.log("\n=== SUPABASE PLAN LIMITS ===\n");
  console.log("  Free tier: 500MB database, 50K rows (soft limit)");
  console.log("  Pro tier ($25/mo): 8GB database, unlimited rows");
  console.log("  → YOU NEED PRO for 10K students. Free tier will run out.");
  console.log("  → $25/month is nothing against $29,900 pilot revenue.");

  console.log("\n=== RECOMMENDED SUPABASE SETTINGS ===\n");
  console.log("  1. Upgrade to Pro plan ($25/month)");
  console.log("  2. Enable connection pooling (Supavisor) — handles concurrent connections");
  console.log("  3. Add database indexes (already done in migrations 00001-00047)");
  console.log("  4. Consider read replicas if query latency increases (Pro feature)");
  console.log("  5. Set up Point-in-Time Recovery (PITR) for data safety ($100/mo add-on, optional)");
  console.log("  6. Monitor via Supabase Dashboard → Database → Database Health");
}
main().catch(console.error);
