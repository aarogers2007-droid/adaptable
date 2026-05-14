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
  // Get AJ's user ID as creator
  const { data: aj } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "aarogers2007@gmail.com")
    .single();

  if (!aj) { console.error("Could not find AJ's profile"); return; }

  const { data: scenario, error } = await supabase
    .from("scenarios")
    .insert({
      title: "The Friday Sellout",
      situation: "You own a pizza slice shop. Every Friday you sell out of pizza by 1pm and have to turn customers away for the rest of the day. You're losing sales you could have made. What do you do?",
      industry: "food",
      difficulty: 1,
      rubric_criteria: ["PROBLEM_VALIDATION", "SOLUTION_VIABILITY"],
      is_sponsored: false,
      badge_name: "The Friday Sellout",
      badge_icon: "🍕",
      is_active: true,
      created_by: aj.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create scenario:", error);
    return;
  }

  console.log("Created scenario:", scenario.id);
  console.log("Title: The Friday Sellout");
  console.log("Industry: food | Difficulty: 1 (Starter)");
  console.log("Criteria: Problem Validation + Solution Viability");
  console.log("\nStudents can find it in the Scenarios tab.");
}

main().catch(console.error);
