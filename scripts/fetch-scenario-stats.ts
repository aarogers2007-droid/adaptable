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
  // Find all scenario sessions from the last 2 hours
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data: sessions } = await supabase
    .from("student_scenario_sessions")
    .select("*")
    .gte("started_at", twoHoursAgo)
    .order("started_at", { ascending: true });

  if (!sessions || sessions.length === 0) {
    console.log("No scenario sessions in the last 2 hours.");
    return;
  }

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║         SCENARIO SESSION DATA REPORT            ║");
  console.log("╚══════════════════════════════════════════════════╝");

  for (const s of sessions) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, grade_level")
      .eq("id", s.student_id)
      .single();

    const { data: scenario } = await supabase
      .from("scenarios")
      .select("title, industry, difficulty")
      .eq("id", s.scenario_id)
      .single();

    console.log(`\n── SESSION ──`);
    console.log(`  Student: ${profile?.full_name ?? s.student_id.slice(0, 8)}`);
    console.log(`  Grade: ${(profile as Record<string, unknown>)?.grade_level ?? "?"}`);
    console.log(`  Scenario: ${scenario?.title ?? s.scenario_id.slice(0, 8)}`);
    console.log(`  Industry: ${scenario?.industry} | Difficulty: ${scenario?.difficulty}`);
    console.log(`  Attempt: ${s.attempt_number}`);
    console.log(`  Status: ${s.status}`);
    console.log(`  Started: ${new Date(s.started_at).toLocaleString()}`);
    if (s.completed_at) {
      const duration = Math.round((new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 60000);
      console.log(`  Completed: ${new Date(s.completed_at).toLocaleString()} (${duration} min)`);
    }
    console.log(`  Badge Level Awarded: ${s.badge_level_awarded ?? "none"}`);

    // Criteria
    console.log(`\n  Criteria Satisfied: ${(s.criteria_satisfied ?? []).join(", ") || "none"}`);

    // Approach summary
    if (s.approach_summary) {
      console.log(`\n  Approach Summary:`);
      const summary = s.approach_summary as Record<string, string>;
      for (const [criterion, desc] of Object.entries(summary)) {
        console.log(`    ${criterion}: ${desc}`);
      }
    }

    // Conversation
    const conversation = (s.conversation ?? []) as { role: string; content: string }[];
    console.log(`\n  Conversation (${conversation.length} messages):`);
    for (let i = 0; i < conversation.length; i++) {
      const msg = conversation[i];
      const label = msg.role === "user" ? "STUDENT" : "MENTOR";
      const preview = msg.content.length > 120 ? msg.content.slice(0, 120) + "..." : msg.content;
      console.log(`    ${String(i + 1).padStart(2)}. [${label}] ${preview}`);
    }
  }

  // Check badges
  console.log(`\n\n── BADGES EARNED ──`);
  const studentIds = [...new Set(sessions.map(s => s.student_id))];
  for (const sid of studentIds) {
    const { data: badges } = await supabase
      .from("student_badges")
      .select("scenario_id, badge_level, first_earned_at")
      .eq("student_id", sid);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", sid)
      .single();

    if (badges && badges.length > 0) {
      for (const b of badges) {
        const { data: sc } = await supabase.from("scenarios").select("title, badge_icon").eq("id", b.scenario_id).single();
        console.log(`  ${profile?.full_name ?? sid.slice(0, 8)} | ${sc?.badge_icon ?? "🏅"} ${sc?.title ?? b.scenario_id.slice(0, 8)} | Level ${b.badge_level} | ${new Date(b.first_earned_at).toLocaleString()}`);
      }
    } else {
      console.log(`  ${profile?.full_name ?? sid.slice(0, 8)} | No badges yet`);
    }
  }

  // Check AI usage for scenario feature
  console.log(`\n\n── SCENARIO AI USAGE ──`);
  const { data: usage } = await supabase
    .from("ai_usage_log")
    .select("student_id, model, input_tokens, output_tokens, estimated_cost_usd, response_length, student_response_time_ms, created_at")
    .eq("feature", "scenario")
    .gte("created_at", twoHoursAgo)
    .order("created_at", { ascending: true });

  if (usage && usage.length > 0) {
    let totalCost = 0;
    const rts: number[] = [];
    for (const r of usage) {
      totalCost += r.estimated_cost_usd ?? 0;
      if (r.student_response_time_ms) rts.push(r.student_response_time_ms);
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", r.student_id).single();
      const rt = r.student_response_time_ms ? `${(r.student_response_time_ms / 1000).toFixed(1)}s` : "—";
      const resp = r.response_length ? `${r.response_length}ch` : "—";
      console.log(`  [${new Date(r.created_at).toLocaleTimeString()}] ${p?.full_name ?? "?"} | ${r.model ?? "?"} | ${r.input_tokens}/${r.output_tokens} tok | resp:${resp} | rt:${rt} | $${(r.estimated_cost_usd ?? 0).toFixed(4)}`);
    }
    console.log(`\n  Total scenario cost: $${totalCost.toFixed(4)}`);
    console.log(`  Total exchanges: ${usage.length}`);
    if (rts.length > 0) {
      const avg = rts.reduce((a, b) => a + b, 0) / rts.length;
      console.log(`  Avg response time: ${(avg / 1000).toFixed(1)}s (${rts.length} measured)`);
    }
  } else {
    console.log("  No scenario AI usage logged");
  }

  console.log("\n══════════════════════════════════════════════════");
}

main().catch(console.error);
