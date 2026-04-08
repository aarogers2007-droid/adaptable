/**
 * Aggressive second-pass scrub. Set all entries to verified=false, then
 * run the scrub against ALL of them — including the 9 "originals" that
 * the first eval marked as clean but the second eval (with stricter Opus
 * judgment) flagged as containing ~41 hallucinated citations across 6
 * entries.
 *
 * No exemptions. The Adaptable Factual Floor applies to every entry,
 * regardless of when it was seeded.
 */

import { readFileSync } from "fs";
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[t.slice(0, i).trim()] = v;
}

import { createClient } from "@supabase/supabase-js";

(async () => {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { error } = await sb
    .from("knowledge_base")
    .update({ verified: false })
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log("All entries set to verified=false. Now run scripts/scrub-knowledge-base.ts.");
})();
