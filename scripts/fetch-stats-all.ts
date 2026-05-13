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
  // Check total row counts
  const { count: usageCount } = await supabase.from("ai_usage_log").select("id", { count: "exact", head: true });
  console.log("ai_usage_log total rows:", usageCount);

  const { count: progressCount } = await supabase.from("student_progress").select("id", { count: "exact", head: true });
  console.log("student_progress total rows:", progressCount);

  // Get the most recent rows
  const { data: recent } = await supabase
    .from("ai_usage_log")
    .select("student_id, feature, created_at, input_tokens, output_tokens")
    .order("created_at", { ascending: false })
    .limit(5);

  console.log("\nMost recent ai_usage_log rows:");
  for (const r of (recent ?? [])) {
    console.log(`  ${r.student_id?.slice(0,8)} | ${r.feature} | ${r.created_at} | ${r.input_tokens}/${r.output_tokens}`);
  }

  // Check profiles for recent ones
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, business_idea, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  console.log("\nMost recent profiles:");
  for (const p of (profiles ?? [])) {
    const bi = p.business_idea as any;
    console.log(`  ${p.full_name ?? "?"} | ${p.email ?? "anon"} | ${p.role} | biz: ${bi?.name ?? "none"} | ${p.created_at}`);
  }

  // Check enrollments
  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("student_id, class_id, enrolled_at")
    .order("enrolled_at", { ascending: false })
    .limit(5);

  console.log("\nMost recent enrollments:");
  for (const e of (enrollments ?? [])) {
    const { data: p } = await supabase.from("profiles").select("full_name").eq("id", e.student_id).single();
    console.log(`  ${p?.full_name ?? e.student_id.slice(0,8)} | class: ${e.class_id.slice(0,8)} | ${e.enrolled_at}`);
  }

  // Check student progress
  const { data: progress } = await supabase
    .from("student_progress")
    .select("student_id, lesson_id, status, completed_at")
    .order("created_at", { ascending: false })
    .limit(10);

  console.log("\nMost recent student_progress:");
  for (const sp of (progress ?? [])) {
    const { data: p } = await supabase.from("profiles").select("full_name").eq("id", sp.student_id).single();
    const { data: l } = await supabase.from("lessons").select("title").eq("id", sp.lesson_id).single();
    console.log(`  ${p?.full_name ?? sp.student_id.slice(0,8)} | ${l?.title ?? sp.lesson_id.slice(0,8)} | ${sp.status} | completed: ${sp.completed_at ?? "no"}`);
  }
}

main().catch(console.error);
