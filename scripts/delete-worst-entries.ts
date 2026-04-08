/**
 * Delete the 5 entries with 2+ hallucination flags from the latest
 * eval-kb-citations-report.md run. Then verify 22/22 lesson coverage
 * still holds against the remaining entries.
 *
 * The 5 worst (per the 2026-04-08 second-pass scan):
 *   - Pricing Strategy Fundamentals for Teen Entrepreneurs (2 flags)
 *   - Customer Interview & Business Validation Masterclass (2 flags, ORIGINAL)
 *   - The Creative Act: Rick Rubin's Principles Applied to Building Ventures (2 flags, ORIGINAL)
 *   - Start With Why: Simon Sineks Golden Circle Applied to Your Ikigai (4 flags, ORIGINAL)
 *   - Learning From Failure: How the Best Entrepreneurs Turn Setbacks Into Breakthroughs (4 flags, ORIGINAL)
 *
 * Total flagged removed: 14 of 18
 * Residual after deletion: ~4 flags across 20 entries (mostly paraphrase variance)
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

const WORST_TITLES = [
  "Pricing Strategy Fundamentals for Teen Entrepreneurs",
  "Customer Interview & Business Validation Masterclass",
  "The Creative Act: Rick Rubin's Principles Applied to Building Ventures",
  "Start With Why: Simon Sineks Golden Circle Applied to Your Ikigai",
  "Learning From Failure: How the Best Entrepreneurs Turn Setbacks Into Breakthroughs",
];

(async () => {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Show what we're about to delete
  const { data: toDelete } = await sb
    .from("knowledge_base")
    .select("id, title, lesson_tags")
    .in("title", WORST_TITLES);

  console.log(`\n== Deleting ${toDelete?.length ?? 0} entries with 2+ hallucination flags ==\n`);
  for (const entry of toDelete ?? []) {
    console.log(`  ✗ ${entry.title}`);
    console.log(`    tags: [${(entry.lesson_tags as string[]).join(", ")}]`);
  }
  console.log("");

  // Execute the deletion
  const { error: delErr, count } = await sb
    .from("knowledge_base")
    .delete({ count: "exact" })
    .in("title", WORST_TITLES);
  if (delErr) {
    console.error("Delete failed:", delErr.message);
    process.exit(1);
  }
  console.log(`Deleted ${count} entries.\n`);

  // Verify remaining count
  const { count: remaining } = await sb
    .from("knowledge_base")
    .select("id", { count: "exact", head: true });
  console.log(`Remaining knowledge_base entries: ${remaining}\n`);

  // ── COVERAGE VERIFICATION ──
  // For each of the 22 lessons, check if any remaining entry matches
  // its lesson_tags. We don't filter by verified here — we need raw
  // coverage to know if dropping these 5 broke anything structurally.
  console.log("== Coverage check after deletion (raw, ignoring verified flag) ==\n");
  let covered = 0;
  let uncovered: string[] = [];
  let thin: string[] = [];

  for (const plan of LESSON_PLANS) {
    const tags = plan.lesson_tags ?? [];
    const matchedIds = new Set<string>();
    for (const tag of tags) {
      const { data } = await sb
        .from("knowledge_base")
        .select("id")
        .contains("lesson_tags", [tag]);
      for (const r of data ?? []) matchedIds.add(r.id as string);
    }
    const hits = matchedIds.size;
    if (hits === 0) {
      uncovered.push(`M${plan.module_id}.L${plan.lesson_id} ${plan.title}`);
      console.log(`  ✗ M${plan.module_id}.L${plan.lesson_id} ${plan.title} — 0 hits`);
    } else if (hits === 1) {
      thin.push(`M${plan.module_id}.L${plan.lesson_id} ${plan.title}`);
      console.log(`  ⚠ M${plan.module_id}.L${plan.lesson_id} ${plan.title} — only 1 hit`);
      covered++;
    } else {
      covered++;
      console.log(`  ✓ M${plan.module_id}.L${plan.lesson_id} ${plan.title} — ${hits} hits`);
    }
  }

  console.log(`\n${covered}/22 lessons covered after deletion`);
  console.log(`${thin.length} thin (1 hit), ${uncovered.length} uncovered (0 hits)`);
  if (uncovered.length > 0) {
    console.log("\n🔴 LESSONS LOST COVERAGE — STOP. Deletion needs revisiting:");
    for (const l of uncovered) console.log(`  - ${l}`);
    process.exit(1);
  }
  if (thin.length > 0) {
    console.log("\n🟡 Lessons with thin coverage (acceptable, but worth noting):");
    for (const l of thin) console.log(`  - ${l}`);
  }
  console.log("\n✅ All 22 lessons retain coverage. Safe to proceed with Option B.");
})();
