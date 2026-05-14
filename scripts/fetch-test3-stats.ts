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
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, org_id, business_idea, ikigai_result, grade_level, grade_tier, created_at")
    .eq("full_name", "Test 3")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!profile) { console.log("Profile 'Test 3' not found"); return; }

  const studentId = profile.id;
  const bi = profile.business_idea as any;

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║         TEST 3 — STUDENT DATA REPORT            ║");
  console.log("╚══════════════════════════════════════════════════╝");

  console.log("\n── PROFILE ──");
  console.log(`  Name: ${profile.full_name}`);
  console.log(`  Grade Level: ${(profile as any).grade_level ?? "not set"}`);
  console.log(`  Grade Tier: ${profile.grade_tier ?? "not set"}`);
  console.log(`  Auth Type: ${profile.email ? "email" : "anonymous"}`);
  console.log(`  Created: ${new Date(profile.created_at!).toLocaleString()}`);

  console.log("\n── BUSINESS IDEA ──");
  if (bi) {
    console.log(`  Name: ${bi.name}`);
    console.log(`  Niche: ${bi.niche}`);
    console.log(`  Target Customer: ${bi.target_customer}`);
    console.log(`  Revenue Model: ${bi.revenue_model}`);
  } else {
    console.log("  Not yet created");
  }

  const { data: usage } = await supabase
    .from("ai_usage_log")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: true });

  console.log(`\n── AI USAGE (${(usage ?? []).length} rows) ──`);

  let totalCost = 0;
  let totalInput = 0;
  let totalOutput = 0;
  let totalCacheWrite = 0;
  let totalCacheRead = 0;
  const responseTimes: number[] = [];

  for (let i = 0; i < (usage ?? []).length; i++) {
    const r = (usage ?? [])[i];
    totalCost += r.estimated_cost_usd ?? 0;
    totalInput += r.input_tokens ?? 0;
    totalOutput += r.output_tokens ?? 0;
    totalCacheWrite += r.cache_write_tokens ?? 0;
    totalCacheRead += r.cache_read_tokens ?? 0;
    if (r.student_response_time_ms) responseTimes.push(r.student_response_time_ms);

    const time = new Date(r.created_at).toLocaleTimeString();
    const rt = r.student_response_time_ms ? `${(r.student_response_time_ms/1000).toFixed(1)}s` : "—";
    const cache = r.cache_read_tokens ? `hit:${r.cache_read_tokens}` : r.cache_write_tokens ? `write:${r.cache_write_tokens}` : "—";
    const resp = r.response_length ? `${r.response_length}ch` : "—";
    const prompt = r.prompt_length ? `${r.prompt_length}ch` : "—";
    const dur = r.session_duration_seconds ? `${r.session_duration_seconds}s` : "—";
    const complete = r.completion_flag ? " ✓COMPLETE" : "";
    console.log(`  ${String(i+1).padStart(2)}. [${time}] ${(r.model ?? r.feature).padEnd(28)} | ${r.input_tokens}in/${r.output_tokens}out | resp:${resp} | prompt:${prompt} | rt:${rt} | dur:${dur} | cache:${cache} | $${(r.estimated_cost_usd ?? 0).toFixed(4)}${complete}`);
  }

  console.log(`\n── TOTALS ──`);
  console.log(`  Exchanges: ${(usage ?? []).length}`);
  console.log(`  Input tokens: ${totalInput.toLocaleString()}`);
  console.log(`  Output tokens: ${totalOutput.toLocaleString()}`);
  console.log(`  Cache writes: ${totalCacheWrite.toLocaleString()} tokens`);
  console.log(`  Cache reads: ${totalCacheRead.toLocaleString()} tokens`);
  console.log(`  Total cost: $${totalCost.toFixed(4)}`);

  if (responseTimes.length > 0) {
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const median = [...responseTimes].sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)];
    console.log(`\n── ENGAGEMENT ──`);
    console.log(`  Measured responses: ${responseTimes.length}`);
    console.log(`  Average: ${(avg / 1000).toFixed(1)}s`);
    console.log(`  Median: ${(median / 1000).toFixed(1)}s`);
    console.log(`  Fastest: ${(Math.min(...responseTimes) / 1000).toFixed(1)}s`);
    console.log(`  Slowest: ${(Math.max(...responseTimes) / 1000).toFixed(1)}s`);
    console.log(`  All: ${responseTimes.map(t => `${(t/1000).toFixed(1)}s`).join(", ")}`);
  } else {
    console.log(`\n── ENGAGEMENT ──`);
    console.log("  No response times captured yet");
  }

  const { data: progress } = await supabase
    .from("student_progress")
    .select("lesson_id, status, completed_at, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: true });

  console.log(`\n── LESSON PROGRESS ──`);
  for (const p of (progress ?? [])) {
    const { data: lesson } = await supabase.from("lessons").select("title, model_override").eq("id", p.lesson_id).single();
    const model = lesson?.model_override ?? "sonnet (default)";
    const duration = p.completed_at
      ? `${Math.round((new Date(p.completed_at).getTime() - new Date(p.created_at!).getTime()) / 60000)}min`
      : "ongoing";
    console.log(`  ${lesson?.title ?? p.lesson_id} [${model}]`);
    console.log(`    Status: ${p.status} | Duration: ${duration}`);
  }

  const { data: enrollment } = await supabase
    .from("class_enrollments")
    .select("class_id, enrolled_at")
    .eq("student_id", studentId);

  console.log(`\n── ENROLLMENT ──`);
  for (const e of (enrollment ?? [])) {
    const { data: cls } = await supabase.from("classes").select("name").eq("id", e.class_id).single();
    console.log(`  Class: ${cls?.name ?? e.class_id} | Enrolled: ${new Date(e.enrolled_at).toLocaleString()}`);
  }

  const { data: achievements } = await supabase
    .from("student_achievements")
    .select("achievement_id, tier, earned_at")
    .eq("student_id", studentId);

  console.log(`\n── ACHIEVEMENTS ──`);
  for (const a of (achievements ?? [])) {
    console.log(`  ${a.achievement_id} (${a.tier}) — ${new Date(a.earned_at).toLocaleString()}`);
  }

  console.log("\n══════════════════════════════════════════════════");
}

main().catch(console.error);
