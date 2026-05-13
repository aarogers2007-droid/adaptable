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
  // Find Test's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, org_id, business_idea, ikigai_result, grade_level, grade_tier, created_at")
    .eq("full_name", "Test")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!profile) { console.log("Profile not found"); return; }

  const studentId = profile.id;
  const bi = profile.business_idea as any;
  const ik = profile.ikigai_result as any;

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║         ADAPTABLE STUDENT DATA REPORT           ║");
  console.log("╚══════════════════════════════════════════════════╝");
  
  console.log("\n── PROFILE ──");
  console.log(`  Name: ${profile.full_name}`);
  console.log(`  Role: ${profile.role}`);
  console.log(`  Grade Level: ${(profile as any).grade_level ?? "not set"}`);
  console.log(`  Grade Tier: ${profile.grade_tier ?? "not set"}`);
  console.log(`  Account Created: ${new Date(profile.created_at!).toLocaleString()}`);
  console.log(`  Auth Type: ${profile.email ? "email" : "anonymous"}`);

  console.log("\n── BUSINESS IDEA ──");
  if (bi) {
    console.log(`  Name: ${bi.name}`);
    console.log(`  Niche: ${bi.niche}`);
    console.log(`  Target Customer: ${bi.target_customer}`);
    console.log(`  Revenue Model: ${bi.revenue_model}`);
  } else {
    console.log("  Not yet created");
  }

  console.log("\n── IKIGAI RESULT ──");
  if (ik) {
    console.log(`  Passions: ${JSON.stringify(ik.passions)}`);
    console.log(`  Skills: ${JSON.stringify(ik.skills)}`);
    console.log(`  Needs: ${JSON.stringify(ik.needs)}`);
    console.log(`  Monetization: ${JSON.stringify(ik.monetization)}`);
  } else {
    console.log("  Not yet completed");
  }

  // AI Usage
  const { data: usage } = await supabase
    .from("ai_usage_log")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: true });

  console.log(`\n── AI USAGE (${(usage ?? []).length} exchanges) ──`);

  let totalCost = 0;
  let totalInput = 0;
  let totalOutput = 0;
  let totalCacheWrite = 0;
  let totalCacheRead = 0;
  const responseTimes: number[] = [];
  let completions = 0;

  for (let i = 0; i < (usage ?? []).length; i++) {
    const r = (usage ?? [])[i];
    totalCost += r.estimated_cost_usd ?? 0;
    totalInput += r.input_tokens ?? 0;
    totalOutput += r.output_tokens ?? 0;
    totalCacheWrite += r.cache_write_tokens ?? 0;
    totalCacheRead += r.cache_read_tokens ?? 0;
    if (r.student_response_time_ms) responseTimes.push(r.student_response_time_ms);
    if (r.completion_flag) completions++;

    const time = new Date(r.created_at).toLocaleTimeString();
    const rt = r.student_response_time_ms ? `${(r.student_response_time_ms/1000).toFixed(1)}s` : "—";
    const cache = r.cache_read_tokens ? `hit:${r.cache_read_tokens}tok` : r.cache_write_tokens ? `write:${r.cache_write_tokens}tok` : "—";
    const resp = r.response_length ? `${r.response_length}chars` : "—";
    const complete = r.completion_flag ? " ✓" : "";
    console.log(`  ${String(i+1).padStart(2)}. [${time}] ${r.feature.padEnd(8)} | ${r.input_tokens}in/${r.output_tokens}out | resp:${resp} | rt:${rt} | cache:${cache} | $${(r.estimated_cost_usd ?? 0).toFixed(4)}${complete}`);
  }

  console.log(`\n── TOTALS ──`);
  console.log(`  Exchanges: ${(usage ?? []).length}`);
  console.log(`  Input tokens: ${totalInput.toLocaleString()}`);
  console.log(`  Output tokens: ${totalOutput.toLocaleString()}`);
  console.log(`  Cache writes: ${totalCacheWrite.toLocaleString()} tokens`);
  console.log(`  Cache reads: ${totalCacheRead.toLocaleString()} tokens`);
  console.log(`  Total cost: $${totalCost.toFixed(4)}`);
  console.log(`  Completions: ${completions}`);

  if (responseTimes.length > 0) {
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const median = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)];
    console.log(`\n── ENGAGEMENT (response times) ──`);
    console.log(`  Measured: ${responseTimes.length} responses`);
    console.log(`  Average: ${(avg / 1000).toFixed(1)}s`);
    console.log(`  Median: ${(median / 1000).toFixed(1)}s`);
    console.log(`  Fastest: ${(Math.min(...responseTimes) / 1000).toFixed(1)}s`);
    console.log(`  Slowest: ${(Math.max(...responseTimes) / 1000).toFixed(1)}s`);
    console.log(`  All: ${responseTimes.map(t => `${(t/1000).toFixed(1)}s`).join(", ")}`);
  }

  // Progress
  const { data: progress } = await supabase
    .from("student_progress")
    .select("lesson_id, status, completed_at, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: true });

  console.log(`\n── LESSON PROGRESS ──`);
  for (const p of (progress ?? [])) {
    const { data: lesson } = await supabase.from("lessons").select("title, module_name").eq("id", p.lesson_id).single();
    const duration = p.completed_at 
      ? `${Math.round((new Date(p.completed_at).getTime() - new Date(p.created_at!).getTime()) / 60000)}min`
      : "ongoing";
    console.log(`  ${lesson?.module_name ?? "?"} → ${lesson?.title ?? p.lesson_id}`);
    console.log(`    Status: ${p.status} | Duration: ${duration} | Started: ${new Date(p.created_at!).toLocaleTimeString()}`);
  }

  // Enrollment
  const { data: enrollment } = await supabase
    .from("class_enrollments")
    .select("class_id, enrolled_at")
    .eq("student_id", studentId);

  console.log(`\n── CLASS ENROLLMENT ──`);
  for (const e of (enrollment ?? [])) {
    const { data: cls } = await supabase.from("classes").select("name").eq("id", e.class_id).single();
    console.log(`  Class: ${cls?.name ?? e.class_id} | Enrolled: ${new Date(e.enrolled_at).toLocaleString()}`);
  }

  // Student ideas
  const { data: ideas } = await supabase
    .from("student_ideas")
    .select("idea_title, idea_summary, created_at")
    .eq("student_id", studentId);

  console.log(`\n── BUSINESS IDEAS CAPTURED ──`);
  if (ideas && ideas.length > 0) {
    for (const idea of ideas) {
      console.log(`  "${idea.idea_title}" — ${idea.idea_summary} (${new Date(idea.created_at).toLocaleTimeString()})`);
    }
  } else {
    console.log("  None yet (captured on lesson completion)");
  }

  // Achievements
  const { data: achievements } = await supabase
    .from("student_achievements")
    .select("achievement_id, tier, earned_at")
    .eq("student_id", studentId);

  console.log(`\n── ACHIEVEMENTS ──`);
  if (achievements && achievements.length > 0) {
    for (const a of achievements) {
      console.log(`  ${a.achievement_id} (${a.tier}) — ${new Date(a.earned_at).toLocaleString()}`);
    }
  } else {
    console.log("  None yet");
  }

  console.log("\n══════════════════════════════════════════════════");
}

main().catch(console.error);
