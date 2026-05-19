import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) { const m = line.match(/^([^#=]+)=(.*)$/); if(m) process.env[m[1].trim()]=m[2].trim(); }
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Get DEMO class enrollments
  const { data: demoCode } = await supabase.from("invite_codes").select("class_id").eq("code", "DEMO").single();
  if (!demoCode) { console.log("No DEMO class"); return; }

  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("student_id, enrolled_at")
    .eq("class_id", demoCode.class_id)
    .order("enrolled_at", { ascending: true });

  console.log(`=== DEMO CLASS (/go) — ${(enrollments ?? []).length} total signups ===\n`);

  // Check for any NEW signups after May 13
  const may14 = "2026-05-14T00:00:00Z";
  const newSignups = (enrollments ?? []).filter(e => e.enrolled_at >= may14);
  console.log(`New signups since May 14: ${newSignups.length}\n`);

  for (const e of (enrollments ?? [])) {
    const { data: p } = await supabase.from("profiles").select("full_name, email, business_idea, grade_level").eq("id", e.student_id).single();

    // Check latest activity
    const { data: lastUsage } = await supabase
      .from("ai_usage_log")
      .select("created_at, feature")
      .eq("student_id", e.student_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { data: progress } = await supabase
      .from("student_progress")
      .select("status")
      .eq("student_id", e.student_id);

    const completed = (progress ?? []).filter(pr => pr.status === "completed").length;
    const inProgress = (progress ?? []).filter(pr => pr.status === "in_progress").length;

    const enrolled = new Date(e.enrolled_at);
    const lastActive = lastUsage ? new Date(lastUsage.created_at) : null;
    const isNew = enrolled >= new Date(may14);
    const returnedAfterMay13 = lastActive && lastActive >= new Date(may14) && enrolled < new Date(may14);

    let status = "inactive";
    if (isNew) status = "🆕 NEW SIGNUP";
    else if (returnedAfterMay13) status = "🔄 RETURNED";
    else if (lastActive) status = "📅 May 13 only";

    const bi = (p?.business_idea as { name?: string } | null)?.name;

    console.log(`  ${p?.full_name ?? "unnamed"} [${status}]`);
    console.log(`    Enrolled: ${enrolled.toLocaleDateString()} | Grade: ${(p as Record<string, unknown>)?.grade_level ?? "?"}`);
    console.log(`    Last active: ${lastActive ? lastActive.toLocaleString() : "never"} | Feature: ${lastUsage?.feature ?? "—"}`);
    console.log(`    Lessons: ${completed} done, ${inProgress} in progress | Business: ${bi ?? "none"}`);
    console.log();
  }
}
main().catch(console.error);
