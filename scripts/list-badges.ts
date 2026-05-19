import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

// Read achievements from code
const achFile = readFileSync("src/lib/achievements.ts", "utf-8");
const matches = achFile.matchAll(/id: "([^"]+)",\s*\n\s*name: "([^"]+)",\s*\n\s*description: "([^"]+)",\s*\n\s*category: "([^"]+)",\s*\n\s*icon: "([^"]+)",\s*\n\s*tiers: \[([^\]]+)\]/g);

console.log("=== CURRICULUM ACHIEVEMENTS (student_achievements table) ===\n");
for (const m of matches) {
  const [, id, name, desc, category, icon, tiers] = m;
  console.log(`  ${icon} ${name} (${id})`);
  console.log(`    Category: ${category}`);
  console.log(`    Tiers: ${tiers.replace(/"/g, "")}`);
  console.log(`    ${desc}`);
  console.log();
}

// Read scenario badges from DB
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const { data: scenarios } = await supabase
  .from("scenarios")
  .select("title, badge_name, badge_icon, industry, difficulty")
  .eq("is_active", true);

console.log("=== SCENARIO BADGES (student_badges table) ===\n");
for (const s of (scenarios ?? [])) {
  console.log(`  ${s.badge_icon} ${s.badge_name}`);
  console.log(`    Scenario: ${s.title}`);
  console.log(`    Industry: ${s.industry} | Difficulty: ${s.difficulty}`);
  console.log(`    Levels: 1, 2, 3 (earned by replaying with different approaches)`);
  console.log();
}

// Count totals
const achCount = achFile.match(/id: "/g)?.length ?? 0;
console.log(`=== TOTALS ===`);
console.log(`  Curriculum achievements: ${achCount}`);
console.log(`  Scenario badges: ${(scenarios ?? []).length}`);
console.log(`  Total badge designs needed: ${achCount + (scenarios ?? []).length}`);
