/**
 * Seed the lessons table with the 14 new lessons across Modules 3-6.
 *
 * The actual conversation content is driven by lesson-plans.ts (in code).
 * The lessons table just needs the route metadata: module/lesson sequence,
 * title, module_name, content_template (placeholder OK), personalization_prompts.
 *
 * This script is idempotent — it uses upsert with onConflict on
 * (module_sequence, lesson_sequence). Safe to re-run.
 *
 * Usage: npx tsx scripts/seed-new-lessons.ts
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

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NewLesson {
  module_name: string;
  module_sequence: number;
  lesson_sequence: number;
  title: string;
  content_template: string;
}

const NEW_LESSONS: NewLesson[] = [
  // Module 3: Build Your Brand
  { module_name: "Build Your Brand", module_sequence: 3, lesson_sequence: 1,
    title: "Brand Identity and Voice",
    content_template: "# Brand Identity and Voice\n\nBrand isn't your logo. Brand is the gut feeling people have about {{business_name}} when you're not in the room. In this lesson you'll define the feeling and voice that make {{business_name}} recognizable." },
  { module_name: "Build Your Brand", module_sequence: 3, lesson_sequence: 2,
    title: "Naming Your Business",
    content_template: "# Naming Your Business\n\nReal teen brands are SHORT. Press Pause. Drip District. Fade Lab. In this lesson you'll generate alternative names for {{business_name}}, run the 24-hour name test with friends, and commit to one you can say out loud without flinching." },
  { module_name: "Build Your Brand", module_sequence: 3, lesson_sequence: 3,
    title: "Designing Your First Impression",
    content_template: "# Designing Your First Impression\n\nThe rule: pick 1 color, 1 font, 1 first-impression message, and stop. In this lesson you'll lock in the minimum viable visual identity for {{business_name}} so you can launch this week instead of designing for three." },

  // Module 4: Get Your First Customer
  { module_name: "Get Your First Customer", module_sequence: 4, lesson_sequence: 1,
    title: "Zero-Budget Marketing",
    content_template: "# Zero-Budget Marketing\n\nYou have $0. Good. The best businesses started with $0 of marketing. In this lesson you'll identify 3 specific places your customers already gather and commit to one zero-budget action this week." },
  { module_name: "Get Your First Customer", module_sequence: 4, lesson_sequence: 2,
    title: "Social Media for a Service Business",
    content_template: "# Social Media for a Service Business\n\nThe 1-1-1 rule: every week, post one thing showing the work, one showing the customer, one showing the human. Three posts a week, 12 a month. In this lesson you'll plan your first month of content for {{business_name}}." },
  { module_name: "Get Your First Customer", module_sequence: 4, lesson_sequence: 3,
    title: "Word of Mouth and Referrals",
    content_template: "# Word of Mouth and Referrals\n\nYour most powerful channel as a teen is the people who already know you. In this lesson you'll design a remarkable moment that makes your first customer tell two friends, and write a referral ask in your own voice." },
  { module_name: "Get Your First Customer", module_sequence: 4, lesson_sequence: 4,
    title: "Writing Your First Pitch",
    content_template: "# Writing Your First Pitch\n\nThe 30-second pitch isn't for investors. It's for the moment a friend's parent says 'so what are you up to?' In this lesson you'll write your pitch using a 4-part story structure and read it out loud until it stops feeling weird." },

  // Module 5: Run the Numbers
  { module_name: "Run the Numbers", module_sequence: 5, lesson_sequence: 1,
    title: "Understanding Your Costs",
    content_template: "# Understanding Your Costs\n\nThe trap most teens fall into: forgetting to count their own time as a cost. If you spend 12 hours making $100 of cookies, you made $8.33/hour. In this lesson you'll list every cost — including time — for one unit of {{business_name}}." },
  { module_name: "Run the Numbers", module_sequence: 5, lesson_sequence: 2,
    title: "Setting Profitable Prices",
    content_template: "# Setting Profitable Prices\n\nThe rule from real bakeries: charge 3-5x your true cost. If you can't, you don't have a business. In this lesson you'll calculate the floor price for {{business_name}}, confront any pricing-confidence gap, and rehearse defending the price out loud." },
  { module_name: "Run the Numbers", module_sequence: 5, lesson_sequence: 3,
    title: "Reading Simple Financials",
    content_template: "# Reading Simple Financials\n\nMost teen businesses die from invisible bookkeeping. The fix is dumber than you think: a 4-column sheet (Date | In | Out | Why) and 5 minutes a week. In this lesson you'll set up the system and commit to the weekly review habit." },

  // Module 6: Launch and Learn
  { module_name: "Launch and Learn", module_sequence: 6, lesson_sequence: 1,
    title: "Shipping Before You're Ready",
    content_template: "# Shipping Before You're Ready\n\nReid Hoffman: 'If you're not embarrassed by the first version of your product, you launched too late.' In this lesson you'll define the smallest possible launch of {{business_name}} and commit to delivering it to one specific person this week." },
  { module_name: "Launch and Learn", module_sequence: 6, lesson_sequence: 2,
    title: "Handling Your First Customer",
    content_template: "# Handling Your First Customer\n\nA real person just said yes. Real money is on the line. In this lesson you'll write your confirmation message, plan for what could go wrong, and design the remarkable delivery moment that turns this customer into someone who tells their friends." },
  { module_name: "Launch and Learn", module_sequence: 6, lesson_sequence: 3,
    title: "Getting Feedback",
    content_template: "# Getting Feedback\n\nThe moment after the customer pays is the most valuable moment in your business. In this lesson you'll write a behavior-based feedback script (no 'did you like it?' questions) and pre-commit to one change you'll make based on what you learn." },
  { module_name: "Launch and Learn", module_sequence: 6, lesson_sequence: 4,
    title: "What to Do After Your First Sale",
    content_template: "# What to Do After Your First Sale\n\nThe difference between a one-time story and a real business is a single decision: do you treat sale #1 as a fluke or as a system? In this lesson you'll plan your celebration, your 24-hour next-step, and identify three specific people for sale #2." },
];

async function main() {
  console.log(`Seeding ${NEW_LESSONS.length} new lessons across modules 3-6\n`);

  // Sanity-check the table is reachable
  const { error: checkError } = await sb.from("lessons").select("id").limit(1);
  if (checkError) {
    console.error(`lessons table not accessible: ${checkError.message}`);
    process.exit(1);
  }

  // Existing count
  const { count: beforeCount } = await sb.from("lessons").select("id", { count: "exact", head: true });
  console.log(`Current lesson count: ${beforeCount}\n`);

  let inserted = 0;
  for (const lesson of NEW_LESSONS) {
    process.stdout.write(`[M${lesson.module_sequence}L${lesson.lesson_sequence}] ${lesson.title.slice(0, 50)}... `);
    const { error } = await sb
      .from("lessons")
      .upsert(
        {
          module_name: lesson.module_name,
          module_sequence: lesson.module_sequence,
          lesson_sequence: lesson.lesson_sequence,
          title: lesson.title,
          content_template: lesson.content_template,
          personalization_prompts: null,
          curriculum_version: 1,
        },
        { onConflict: "module_sequence,lesson_sequence" }
      );
    if (error) {
      console.log(` X ${error.message}`);
    } else {
      inserted++;
      console.log(" ✓");
    }
  }

  const { count: afterCount } = await sb.from("lessons").select("id", { count: "exact", head: true });
  console.log(`\nDone. ${inserted}/${NEW_LESSONS.length} upserted. Lesson count: ${beforeCount} → ${afterCount}`);
}

main().catch(console.error);
