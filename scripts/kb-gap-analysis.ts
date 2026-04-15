/**
 * Knowledge base gap analysis: cross-references lesson_tags from every lesson
 * against knowledge_base entries to identify coverage gaps.
 */
import { readFileSync } from "fs";
import path from "path";

const envFile = readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  let val = t.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
    val = val.slice(1, -1);
  process.env[t.slice(0, eq).trim()] = val;
}

import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

interface Lesson {
  module: number;
  lesson: number;
  title: string;
  tags: string[];
}

const LESSONS: Lesson[] = [
  { module: 1, lesson: 1, title: "Welcome to Adaptable", tags: ["why", "purpose", "ikigai", "golden-circle", "getting-started", "mindset"] },
  { module: 1, lesson: 2, title: "What Makes a Good Business Niche?", tags: ["niche-validation", "validation", "product-market-fit", "lean-startup", "business-model"] },
  { module: 1, lesson: 3, title: "Research Your Competition", tags: ["competition", "differentiation", "niche-selection", "positioning"] },
  { module: 1, lesson: 4, title: "Define Your Target Customer", tags: ["target-customer", "customer-personas", "jobs-to-be-done", "niche-selection", "value-proposition"] },
  { module: 2, lesson: 1, title: "The Customer Interview", tags: ["customer-interviews", "validation", "talking-to-users"] },
  { module: 2, lesson: 2, title: "What Did You Learn?", tags: ["customer-interviews", "validation", "iteration", "pivoting", "growth-mindset"] },
  { module: 2, lesson: 3, title: "Set Your Price", tags: ["pricing", "set-your-price", "revenue-model", "pricing-confidence"] },
  { module: 2, lesson: 4, title: "Your First 3 Customers", tags: ["first-customers", "customer-acquisition", "marketing", "pitching", "sales"] },
  { module: 3, lesson: 1, title: "Brand Identity and Voice", tags: ["branding", "brand-identity", "differentiation", "positioning"] },
  { module: 3, lesson: 2, title: "Naming Your Business", tags: ["naming", "branding", "visual-identity", "getting-started"] },
  { module: 3, lesson: 3, title: "Designing Your First Impression", tags: ["branding", "visual-identity", "customer-experience"] },
  { module: 4, lesson: 1, title: "Zero-Budget Marketing", tags: ["marketing", "first-customers", "customer-acquisition", "getting-started"] },
  { module: 4, lesson: 2, title: "Social Media for a Service Business", tags: ["social-media", "content-marketing", "tiktok", "audience-building", "marketing"] },
  { module: 4, lesson: 3, title: "Word of Mouth and Referrals", tags: ["customer-acquisition", "first-customers", "marketing", "customer-experience"] },
  { module: 4, lesson: 4, title: "Writing Your First Pitch", tags: ["pitching", "storytelling", "elevator-pitch", "communication", "first-customers"] },
  { module: 5, lesson: 1, title: "Understanding Your Costs", tags: ["financial-literacy", "costs", "unit-economics", "pricing"] },
  { module: 5, lesson: 2, title: "How Real Teens Price Their Work", tags: ["pricing", "pricing-confidence", "profit-margins", "unit-economics"] },
  { module: 5, lesson: 3, title: "Reading Simple Financials", tags: ["financial-literacy", "bookkeeping", "tracking", "habit-building"] },
  { module: 6, lesson: 1, title: "Shipping Before You're Ready", tags: ["shipping", "getting-started", "mvp", "iteration", "constraints"] },
  { module: 6, lesson: 2, title: "Handling Your First Customer", tags: ["service-delivery", "customer-experience", "operations", "reliability"] },
  { module: 6, lesson: 3, title: "Getting Feedback", tags: ["customer-interviews", "iteration", "validation", "growth-mindset"] },
  { module: 6, lesson: 4, title: "What to Do After Your First Sale", tags: ["iteration", "growth", "scaling", "mindset", "growth-mindset"] },
];

async function main() {
  const { data: kbEntries } = await sb
    .from("knowledge_base")
    .select("title, lesson_tags, verified");

  if (!kbEntries) { console.error("Failed to fetch KB"); process.exit(1); }

  // Two analyses: broad (≥1 tag overlap) and strict (≥2 tag overlap)

  interface LessonMatch {
    lesson: Lesson;
    broadCount: number;
    strictCount: number;
    strictTitles: string[];
  }

  const results: LessonMatch[] = [];

  for (const lesson of LESSONS) {
    let broadCount = 0;
    let strictCount = 0;
    const strictTitles: string[] = [];

    for (const kb of kbEntries) {
      const kbTags = kb.lesson_tags as string[];
      const overlap = lesson.tags.filter(t => kbTags.includes(t));
      if (overlap.length >= 1) broadCount++;
      if (overlap.length >= 2) {
        strictCount++;
        strictTitles.push(kb.title as string);
      }
    }

    results.push({ lesson, broadCount, strictCount, strictTitles });
  }

  console.log("| Module | Title | Broad (≥1 tag) | Strict (≥2 tags) | Strict Gap |");
  console.log("|---|---|---|---|---|");

  for (const r of results) {
    const gap = r.strictCount < 3 ? `GAP (need ${3 - r.strictCount} more)` :
                r.strictCount < 5 ? `THIN (${r.strictCount}/5)` : "";
    console.log(`| M${r.lesson.module}L${r.lesson.lesson} | ${r.lesson.title.padEnd(38)} | ${String(r.broadCount).padStart(2)} | ${String(r.strictCount).padStart(2)} | ${gap} |`);
  }

  // Summary
  const p0 = results.filter(r => r.strictCount < 3);
  const thin = results.filter(r => r.strictCount >= 3 && r.strictCount < 5);
  const good = results.filter(r => r.strictCount >= 5);

  console.log("");
  console.log(`P0 gaps (strict < 3): ${p0.length} lessons`);
  console.log(`Thin coverage (strict 3-4): ${thin.length} lessons`);
  console.log(`Good coverage (strict ≥ 5): ${good.length} lessons`);

  // Priority modules detail
  const priorityModules = [5, 4, 6, 3];
  console.log("\n=== PRIORITY MODULE DETAILS ===\n");

  for (const mod of priorityModules) {
    const modResults = results.filter(r => r.lesson.module === mod);
    console.log(`── Module ${mod} ──`);
    for (const r of modResults) {
      const status = r.strictCount < 3 ? "P0 GAP" : r.strictCount < 5 ? "THIN" : "OK";
      console.log(`  M${r.lesson.module}L${r.lesson.lesson}: ${r.lesson.title}`);
      console.log(`    Strict coverage: ${r.strictCount} entries [${status}]`);
      console.log(`    Tags: [${r.lesson.tags.join(", ")}]`);
      if (r.strictTitles.length > 0) {
        for (const t of r.strictTitles) {
          console.log(`    ✓ ${t.slice(0, 65)}`);
        }
      }
      if (r.strictCount < 5) {
        console.log(`    → Need ${5 - r.strictCount} more entries`);
      }
      console.log("");
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
