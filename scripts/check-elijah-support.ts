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
    .select("id")
    .eq("full_name", "Elijah")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!profile) { console.log("Not found"); return; }

  // Check support_conversations
  const { data: convos } = await supabase
    .from("support_conversations")
    .select("*")
    .eq("student_id", profile.id)
    .order("created_at", { ascending: true });

  if (convos && convos.length > 0) {
    console.log("=== SUPPORT CONVERSATIONS ===\n");
    for (const c of convos) {
      const messages = (c.messages ?? []) as { role: string; content: string }[];
      console.log(`Conversation ${c.id.slice(0, 8)} — ${new Date(c.created_at).toLocaleString()}\n`);
      for (const m of messages) {
        const label = m.role === "user" ? "ELIJAH" : "SUPPORT";
        console.log(`  [${label}] ${m.content}`);
      }
      console.log();
    }
  } else {
    console.log("No support conversations found");
  }

  // Also check ai_conversations table
  const { data: aiConvos } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("student_id", profile.id)
    .order("created_at", { ascending: true });

  if (aiConvos && aiConvos.length > 0) {
    console.log("=== AI CONVERSATIONS ===\n");
    for (const c of aiConvos) {
      const messages = (c.messages ?? []) as { role: string; content: string }[];
      console.log(`Conversation ${c.id.slice(0, 8)} — feature: ${c.feature ?? "?"}\n`);
      for (const m of messages) {
        const label = m.role === "user" ? "ELIJAH" : "AI";
        console.log(`  [${label}] ${m.content.slice(0, 200)}${m.content.length > 200 ? "..." : ""}`);
      }
      console.log();
    }
  }

  // Check support_escalations
  const { data: escalations } = await supabase
    .from("support_escalations")
    .select("*")
    .eq("user_name", "Elijah");

  if (escalations && escalations.length > 0) {
    console.log("=== ESCALATIONS ===\n");
    for (const e of escalations) {
      console.log(`  ${e.summary}`);
    }
  }
}

main().catch(console.error);
