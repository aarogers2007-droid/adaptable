/**
 * One-time script to create a DEMO class for the IGNITE event.
 * Run with: npx tsx scripts/create-demo-class.ts
 *
 * Creates:
 * 1. A class called "IGNITE Demo" under the Adaptable default org
 * 2. An invite code "DEMO" for that class
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Parse .env.local manually (no dotenv dependency)
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
  const ADAPTABLE_ORG_ID = "00000000-0000-0000-0000-000000000001";

  // Check if DEMO code already exists
  const { data: existing } = await supabase
    .from("invite_codes")
    .select("code, class_id")
    .eq("code", "DEMO")
    .single();

  if (existing) {
    console.log("DEMO code already exists for class:", existing.class_id);
    return;
  }

  // Get AJ's user ID (platform owner) as the instructor
  const { data: aj } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "aarogers2007@gmail.com")
    .single();

  if (!aj) {
    console.error("Could not find AJ's profile. Run this after signing in at least once.");
    return;
  }

  // Create class
  const { data: cls, error: classErr } = await supabase
    .from("classes")
    .insert({
      org_id: ADAPTABLE_ORG_ID,
      instructor_id: aj.id,
      name: "IGNITE Demo",
      session_type: "curriculum",
    })
    .select("id")
    .single();

  if (classErr || !cls) {
    console.error("Failed to create class:", classErr);
    return;
  }

  console.log("Created class:", cls.id);

  // Create invite code
  const { error: codeErr } = await supabase
    .from("invite_codes")
    .insert({
      code: "DEMO",
      class_id: cls.id,
      created_by: aj.id,
      max_uses: 200,
      current_uses: 0,
    });

  if (codeErr) {
    console.error("Failed to create invite code:", codeErr);
    return;
  }

  console.log("Created invite code: DEMO");
  console.log("Students go to: adaptable-one.vercel.app/go");
  console.log("They enter code DEMO + their first name");
  console.log("\nDone. Class is ready for the IGNITE event.");
}

main().catch(console.error);
