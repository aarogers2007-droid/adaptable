/**
 * After Option C ships, check how many lessons still have verified-only
 * coverage (vs falling back to unverified). If a lesson's only hits are
 * unverified, that means the AI mentor will pull citation-risky context
 * for that lesson until Option B regenerates the entries.
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
import { LESSON_PLANS } from "../src/lib/lesson-plans";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
  console.log("\nVerified-first coverage report\n");
  let solidVerified = 0;
  let fallbackOnly = 0;
  const fallbackList: string[] = [];

  for (const plan of LESSON_PLANS) {
    const tags = plan.lesson_tags ?? [];
    let verifiedHits = 0;
    let totalHits = 0;
    const verifiedIds = new Set<string>();
    const allIds = new Set<string>();

    for (const tag of tags) {
      const { data: ver } = await sb
        .from("knowledge_base")
        .select("id")
        .contains("lesson_tags", [tag])
        .eq("verified", true);
      const { data: all } = await sb
        .from("knowledge_base")
        .select("id")
        .contains("lesson_tags", [tag]);
      for (const r of ver ?? []) verifiedIds.add(r.id as string);
      for (const r of all ?? []) allIds.add(r.id as string);
    }
    verifiedHits = verifiedIds.size;
    totalHits = allIds.size;

    if (verifiedHits >= 1) {
      solidVerified++;
      console.log(`  ✓ M${plan.module_id}.L${plan.lesson_id} ${plan.title} — ${verifiedHits} verified hit${verifiedHits === 1 ? "" : "s"} (${totalHits} total)`);
    } else if (totalHits >= 1) {
      fallbackOnly++;
      fallbackList.push(`M${plan.module_id}.L${plan.lesson_id} ${plan.title}`);
      console.log(`  ⚠ M${plan.module_id}.L${plan.lesson_id} ${plan.title} — 0 verified, will fall back to ${totalHits} unverified`);
    } else {
      console.log(`  ✗ M${plan.module_id}.L${plan.lesson_id} ${plan.title} — 0 hits at all`);
    }
  }

  console.log(`\n${solidVerified}/22 lessons have verified RAG context`);
  console.log(`${fallbackOnly}/22 lessons fall back to unverified entries`);
  if (fallbackList.length > 0) {
    console.log("\nLessons that need verified entries (Option B priority):");
    for (const l of fallbackList) console.log(`  - ${l}`);
  }
})();
