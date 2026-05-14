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
  // Get the DEMO class ID
  const { data: demoCode } = await supabase
    .from("invite_codes")
    .select("class_id")
    .eq("code", "DEMO")
    .single();

  if (!demoCode) { console.log("No DEMO class found"); return; }

  // Get all enrollments in the DEMO class
  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("student_id, enrolled_at")
    .eq("class_id", demoCode.class_id)
    .order("enrolled_at", { ascending: true });

  if (!enrollments || enrollments.length === 0) {
    console.log("No enrollments in DEMO class");
    return;
  }

  console.log(`\n=== DEMO CLASS (/go) SIGNUPS ===\n`);
  console.log(`Total: ${enrollments.length} students\n`);

  for (const e of enrollments) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, grade_level, business_idea, created_at")
      .eq("id", e.student_id)
      .single();

    const bi = profile?.business_idea as { name?: string } | null;
    const authType = profile?.email ? "email" : "anonymous (/go)";
    
    // Check their activity
    const { count: aiCalls } = await supabase
      .from("ai_usage_log")
      .select("id", { count: "exact", head: true })
      .eq("student_id", e.student_id);

    const { data: progress } = await supabase
      .from("student_progress")
      .select("status")
      .eq("student_id", e.student_id);

    const completed = (progress ?? []).filter(p => p.status === "completed").length;
    const inProgress = (progress ?? []).filter(p => p.status === "in_progress").length;

    // Check scenario sessions
    const { count: scenarioSessions } = await supabase
      .from("student_scenario_sessions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", e.student_id);

    const enrolled = new Date(e.enrolled_at).toLocaleString();

    console.log(`  ${profile?.full_name ?? "unnamed"}`);
    console.log(`    Auth: ${authType} | Grade: ${(profile as any)?.grade_level ?? "?"}`);
    console.log(`    Enrolled: ${enrolled}`);
    console.log(`    Business: ${bi?.name ?? "not yet"}`);
    console.log(`    Lessons: ${completed} completed, ${inProgress} in progress`);
    console.log(`    AI exchanges: ${aiCalls ?? 0}`);
    console.log(`    Scenario sessions: ${scenarioSessions ?? 0}`);
    console.log();
  }
}

main().catch(console.error);
