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
    .select("id, full_name, business_idea, ikigai_result, grade_level, created_at")
    .eq("full_name", "Elijah")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!profile) { console.log("Elijah not found"); return; }

  console.log("=== ELIJAH'S ACTIVITY ===\n");

  // All AI usage with feature breakdown
  const { data: usage } = await supabase
    .from("ai_usage_log")
    .select("feature, model, input_tokens, output_tokens, lesson_id, created_at")
    .eq("student_id", profile.id)
    .order("created_at", { ascending: true });

  console.log(`AI exchanges: ${(usage ?? []).length}\n`);
  for (const u of (usage ?? [])) {
    console.log(`  [${new Date(u.created_at).toLocaleTimeString()}] feature: ${u.feature} | model: ${u.model ?? "?"} | ${u.input_tokens}/${u.output_tokens} tok | lesson_id: ${u.lesson_id ?? "null"}`);
  }

  // Check progress
  const { data: progress } = await supabase
    .from("student_progress")
    .select("lesson_id, status, created_at")
    .eq("student_id", profile.id);

  console.log(`\nLesson progress rows: ${(progress ?? []).length}`);
  for (const p of (progress ?? [])) {
    const { data: lesson } = await supabase.from("lessons").select("title").eq("id", p.lesson_id).single();
    console.log(`  ${lesson?.title ?? p.lesson_id} — ${p.status} — ${new Date(p.created_at!).toLocaleTimeString()}`);
  }

  // Business idea
  const bi = profile.business_idea as any;
  console.log(`\nBusiness: ${bi?.name ?? "none"}`);
  if (bi) {
    console.log(`  Niche: ${bi.niche}`);
    console.log(`  Target: ${bi.target_customer}`);
    console.log(`  Revenue: ${bi.revenue_model}`);
  }

  // Ikigai
  const ik = profile.ikigai_result as any;
  if (ik) {
    console.log(`\nIkigai:`);
    console.log(`  Passions: ${JSON.stringify(ik.passions)}`);
    console.log(`  Skills: ${JSON.stringify(ik.skills)}`);
    console.log(`  Needs: ${JSON.stringify(ik.needs)}`);
  }

  // Achievements
  const { data: achievements } = await supabase
    .from("student_achievements")
    .select("achievement_id, tier")
    .eq("student_id", profile.id);

  console.log(`\nAchievements: ${(achievements ?? []).length}`);
  for (const a of (achievements ?? [])) {
    console.log(`  ${a.achievement_id} (${a.tier})`);
  }
}

main().catch(console.error);
