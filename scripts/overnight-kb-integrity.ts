/**
 * overnight-kb-integrity.ts — structural integrity sweep of the verified
 * knowledge base. Confirms the demo claims still hold and every entry is
 * well-formed enough to actually surface in RAG context.
 *
 * Checks:
 *   1. Verified entry count matches the demo claim (20)
 *   2. All 22 lessons have at least one verified entry via lesson_tags
 *   3. Every verified entry has the required fields populated (no nulls
 *      that would cause RAG to surface garbage)
 *   4. Every verified entry has at least one key principle
 *   5. No empty student_friendly_summary
 *
 * Exits 0 if all green, 1 if any structural problem.
 */

import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[t.slice(0, i).trim()] = v;
}

import { createClient } from "@supabase/supabase-js";

const EXPECTED_ENTRY_COUNT = 20;
const EXPECTED_LESSON_COUNT = 22;

interface KbRow {
  id: string;
  title: string | null;
  topic: string | null;
  lesson_tags: string[] | null;
  key_principles: unknown;
  student_friendly_summary: string | null;
  concrete_examples: unknown;
  quotes: unknown;
}

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: rows, error } = await sb
    .from("knowledge_base")
    .select(
      "id, title, topic, lesson_tags, key_principles, student_friendly_summary, concrete_examples, quotes"
    )
    .eq("verified", true);

  if (error) {
    console.error("DB error:", error);
    process.exit(1);
  }

  const entries: KbRow[] = (rows ?? []) as KbRow[];
  const fails: string[] = [];

  // Check 1: entry count
  console.log(`Verified entries: ${entries.length} (expected ${EXPECTED_ENTRY_COUNT})`);
  if (entries.length !== EXPECTED_ENTRY_COUNT) {
    fails.push(`Entry count mismatch: ${entries.length} vs expected ${EXPECTED_ENTRY_COUNT}`);
  }

  // Check 2: lesson coverage
  const lessonsCovered = new Set<string>();
  for (const e of entries) {
    for (const tag of e.lesson_tags ?? []) {
      if (tag) lessonsCovered.add(tag);
    }
  }
  console.log(`Lesson tags covered: ${lessonsCovered.size}`);

  // Walk authoritative lesson list and confirm every lesson has at least one
  // tag overlap with the verified KB. Each lesson plan declares its own
  // lesson_tags list — if any of those tags appears in the KB, the lesson
  // gets verified RAG context.
  const { LESSON_PLANS } = await import("../src/lib/lesson-plans");
  const totalLessons = LESSON_PLANS.length;
  const uncoveredLessons: string[] = [];
  for (const plan of LESSON_PLANS) {
    const planTags = plan.lesson_tags ?? [];
    const hasOverlap = planTags.some((t) => lessonsCovered.has(t));
    if (!hasOverlap) {
      uncoveredLessons.push(`M${plan.module_id}.L${plan.lesson_id} ${plan.title}`);
    }
  }

  console.log(`Total lessons in plan: ${totalLessons}`);
  console.log(`Uncovered lessons: ${uncoveredLessons.length}`);

  if (totalLessons !== EXPECTED_LESSON_COUNT) {
    console.warn(
      `(warn) lesson plan has ${totalLessons} entries, demo claims ${EXPECTED_LESSON_COUNT}`
    );
  }
  if (uncoveredLessons.length > 0) {
    for (const u of uncoveredLessons) console.log(`  - ${u}`);
    fails.push(`${uncoveredLessons.length} lessons with no verified KB overlap`);
  }

  // Check 3+4: required fields
  const fieldFails: string[] = [];
  for (const e of entries) {
    const missing: string[] = [];
    if (!e.title || e.title.trim().length === 0) missing.push("title");
    if (!e.topic || e.topic.trim().length === 0) missing.push("topic");
    if (!e.student_friendly_summary || e.student_friendly_summary.trim().length === 0) {
      missing.push("student_friendly_summary");
    }
    const principles = Array.isArray(e.key_principles) ? e.key_principles : [];
    if (principles.length === 0) missing.push("key_principles (empty)");
    if (missing.length > 0) {
      fieldFails.push(`${e.title?.slice(0, 50) ?? e.id}: ${missing.join(", ")}`);
    }
  }
  console.log(`Field-incomplete entries: ${fieldFails.length}`);
  if (fieldFails.length > 0) {
    for (const f of fieldFails) console.log(`  - ${f}`);
    fails.push(`${fieldFails.length} entries missing required fields`);
  }

  // Summary
  console.log("");
  if (fails.length === 0) {
    console.log("✅ KB integrity PASSED");
    console.log(`  - ${entries.length} verified entries`);
    console.log(`  - ${lessonsCovered.size} lesson tags covered`);
    console.log(`  - ${totalLessons}/${totalLessons} lessons in plan have a verified KB overlap`);
    console.log(`  - 0 entries with missing required fields`);
    process.exit(0);
  } else {
    console.log("❌ KB integrity FAILED");
    for (const f of fails) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
