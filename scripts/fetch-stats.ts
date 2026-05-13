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
  // Find recent AI usage (last 24 hours)
  const twoHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: usage } = await supabase
    .from("ai_usage_log")
    .select("student_id, feature, model, input_tokens, output_tokens, estimated_cost_usd, cache_write_tokens, cache_read_tokens, response_length, prompt_length, session_duration_seconds, lesson_id, completion_flag, student_response_time_ms, created_at")
    .gte("created_at", twoHoursAgo)
    .order("created_at", { ascending: true });

  if (!usage || usage.length === 0) {
    console.log("No AI usage in the last 24 hours.");
    return;
  }

  console.log(`\n=== AI USAGE LOG (${usage.length} rows, last 24 hours) ===\n`);
  
  // Group by student
  const byStudent = new Map<string, typeof usage>();
  for (const row of usage) {
    const sid = row.student_id ?? "unknown";
    if (!byStudent.has(sid)) byStudent.set(sid, []);
    byStudent.get(sid)!.push(row);
  }

  for (const [studentId, rows] of byStudent) {
    // Get student name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, business_idea, grade_level, grade_tier")
      .eq("id", studentId)
      .single();

    console.log(`\n── Student: ${profile?.full_name ?? profile?.email ?? studentId.slice(0, 8)} ──`);
    console.log(`   Grade: ${(profile as any)?.grade_level ?? "?"} | Tier: ${profile?.grade_tier ?? "?"}`);
    
    if (profile?.business_idea) {
      const bi = profile.business_idea as any;
      console.log(`   Business: "${bi.name}" — ${bi.niche}`);
      console.log(`   Target: ${bi.target_customer} | Revenue: ${bi.revenue_model}`);
    }

    console.log(`\n   Exchanges: ${rows.length}`);
    
    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheWrite = 0;
    let totalCacheRead = 0;
    const responseTimes: number[] = [];

    for (const row of rows) {
      totalCost += row.estimated_cost_usd ?? 0;
      totalInputTokens += row.input_tokens ?? 0;
      totalOutputTokens += row.output_tokens ?? 0;
      totalCacheWrite += row.cache_write_tokens ?? 0;
      totalCacheRead += row.cache_read_tokens ?? 0;
      if (row.student_response_time_ms) responseTimes.push(row.student_response_time_ms);
    }

    console.log(`   Total tokens: ${totalInputTokens} in / ${totalOutputTokens} out`);
    console.log(`   Cache: ${totalCacheWrite} write / ${totalCacheRead} read`);
    console.log(`   Total cost: $${totalCost.toFixed(4)}`);
    
    if (responseTimes.length > 0) {
      const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const min = Math.min(...responseTimes);
      const max = Math.max(...responseTimes);
      console.log(`\n   Response times (${responseTimes.length} measured):`);
      console.log(`     Avg: ${(avg / 1000).toFixed(1)}s | Min: ${(min / 1000).toFixed(1)}s | Max: ${(max / 1000).toFixed(1)}s`);
      console.log(`     All: ${responseTimes.map(t => `${(t/1000).toFixed(1)}s`).join(", ")}`);
    } else {
      console.log(`\n   Response times: not yet deployed (migration 00047 pending)`);
    }

    const completions = rows.filter(r => r.completion_flag);
    console.log(`   Completions: ${completions.length}`);
    
    if (rows[0]?.session_duration_seconds) {
      const lastRow = rows[rows.length - 1];
      console.log(`   Session duration: ${lastRow.session_duration_seconds}s (${Math.round((lastRow.session_duration_seconds ?? 0) / 60)}min)`);
    }

    // Per-exchange detail
    console.log(`\n   Per-exchange:`);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const time = new Date(r.created_at).toLocaleTimeString();
      const rt = r.student_response_time_ms ? `${(r.student_response_time_ms/1000).toFixed(1)}s` : "—";
      const cache = r.cache_read_tokens ? `cache:${r.cache_read_tokens}` : r.cache_write_tokens ? `write:${r.cache_write_tokens}` : "no-cache";
      console.log(`     ${i+1}. [${time}] ${r.feature} | ${r.input_tokens}in/${r.output_tokens}out | resp:${r.response_length ?? "?"}chars | rt:${rt} | ${cache} | $${(r.estimated_cost_usd ?? 0).toFixed(4)}${r.completion_flag ? " ✓COMPLETE" : ""}`);
    }
  }

  // Check student_progress
  console.log("\n\n=== STUDENT PROGRESS ===\n");
  const { data: progress } = await supabase
    .from("student_progress")
    .select("student_id, lesson_id, status, completed_at, created_at")
    .gte("created_at", twoHoursAgo);

  for (const p of (progress ?? [])) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", p.student_id).single();
    const { data: lesson } = await supabase.from("lessons").select("title").eq("id", p.lesson_id).single();
    console.log(`  ${profile?.full_name ?? p.student_id.slice(0,8)} | ${lesson?.title ?? p.lesson_id} | ${p.status} | ${p.completed_at ? "completed " + new Date(p.completed_at).toLocaleTimeString() : "in progress"}`);
  }

  // Check student_ideas
  console.log("\n\n=== STUDENT IDEAS ===\n");
  const { data: ideas } = await supabase
    .from("student_ideas")
    .select("student_id, idea_title, idea_summary, created_at")
    .gte("created_at", twoHoursAgo);

  if (ideas && ideas.length > 0) {
    for (const idea of ideas) {
      console.log(`  "${idea.idea_title}" — ${idea.idea_summary} (${new Date(idea.created_at).toLocaleTimeString()})`);
    }
  } else {
    console.log("  No ideas captured in the last 24 hours.");
  }

  // Check class enrollment
  console.log("\n\n=== DEMO CLASS ENROLLMENT ===\n");
  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("student_id, class_id, enrolled_at")
    .gte("enrolled_at", twoHoursAgo);

  for (const e of (enrollments ?? [])) {
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", e.student_id).single();
    console.log(`  ${profile?.full_name ?? e.student_id.slice(0,8)} enrolled at ${new Date(e.enrolled_at).toLocaleTimeString()}`);
  }
}

main().catch(console.error);
