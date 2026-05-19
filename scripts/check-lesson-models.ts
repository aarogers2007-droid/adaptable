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
  const { data: lessons } = await supabase
    .from("lessons")
    .select("title, module_name, module_sequence, lesson_sequence, model_override")
    .order("module_sequence")
    .order("lesson_sequence");

  console.log("LESSON MODEL ASSIGNMENTS\n");
  for (const l of (lessons ?? [])) {
    const _model = l.model_override ?? "SONNET (default)";
    const tag = l.model_override?.includes("mini") ? "💰 MINI" : "🧠 SONNET";
    console.log(`  ${tag}  M${l.module_sequence}L${l.lesson_sequence} — ${l.title}`);
  }

  const miniCount = (lessons ?? []).filter(l => l.model_override?.includes("mini")).length;
  const sonnetCount = (lessons ?? []).length - miniCount;
  console.log(`\nTotal: ${miniCount} mini / ${sonnetCount} sonnet / ${(lessons ?? []).length} total`);
}

main().catch(console.error);
