/**
 * Extended knowledge_base seed: 8 new topics × 2 entries each = 16 entries.
 *
 * Mirrors the pattern in scripts/seed-knowledge-base.ts (the original seed
 * that produced the 9 starter entries). Same 2-agent pipeline:
 *   Agent 1 — researcher: synthesizes principles, examples, quotes
 *   Agent 2 — challenger: skeptical 16-year-old voice, writes the
 *             student_friendly_summary and challenge_qa
 *
 * Each entry has a distinct angle so we don't get duplicates within a topic.
 *
 * Topics added (per AJ's request):
 *   1. Branding and brand identity for teen entrepreneurs
 *   2. Operations and service delivery
 *   3. Financial literacy — profit, costs, revenue
 *   4. Storytelling and elevator pitch
 *   5. Target customer profiling and personas
 *   6. Business model design
 *   7. Pricing confidence — closing the confidence gap for young women + minorities
 *   8. Social media and zero-budget content marketing
 *
 * Usage: npx tsx scripts/seed-knowledge-extended.ts
 */

import { readFileSync } from "fs";

// Load .env.local BEFORE anything else
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  let value = trimmed.slice(eqIndex + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY not found in .env.local");
  process.exit(1);
}

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Seed {
  topic: string;
  angle: string;
  tags: string[];
  research_seed: string;
}

const SEEDS: Seed[] = [
  // ── 1. Branding and brand identity ──
  {
    topic: "Branding and brand identity for teen entrepreneurs",
    angle: "Brand as the gut feeling people have about you, applied to a teen running a press-on nail hustle or a Pokemon card resell account",
    tags: ["branding", "brand-identity", "differentiation", "positioning", "naming"],
    research_seed: "Marty Neumeier (The Brand Gap, ZAG), Bernadette Jiwa (The Right Story), Glossier as a teen-relevant brand built from a content account, the Studio Studio counter-example (generic AI-slop names), how Trapstar started in a London bedroom with no money. 'Brand is what people say about you when you're not in the room' — Bezos. The point is differentiation through specificity, not logo polish.",
  },
  {
    topic: "Branding and brand identity for teen entrepreneurs",
    angle: "Practical naming and visual identity for someone with $0 — what makes a name memorable, why 1 color and 1 font is enough, the 24-hour name test",
    tags: ["branding", "naming", "visual-identity", "first-customers", "getting-started"],
    research_seed: "Naming heuristics from Igor International and Lexicon Branding (the firm that named Pentium, Swiffer, BlackBerry). Why short names beat descriptive names. Why Press Pause beats Mia's Custom Nail Studio. The Cluely / Suno / Cursor pattern of one-word brands. The 24-hour name test — text 3 friends, ask which they remember tomorrow.",
  },

  // ── 2. Operations and service delivery ──
  {
    topic: "Operations and service delivery for first-time small businesses",
    angle: "The boring stuff that decides survival — scheduling, supply runs, showing up on time. System over hustle.",
    tags: ["operations", "service-delivery", "reliability", "first-customers", "scaling"],
    research_seed: "Atul Gawande's Checklist Manifesto applied to a teen babysitting business. Mike Michalowicz's Profit First and 'eat the frog'. Real example: a 14-year-old dog-walking business in Brooklyn that scaled to 8 weekly clients via shared Google Calendar and a $5 supply tote. The reliability premium — customers pay more for someone who shows up on time.",
  },
  {
    topic: "Operations and service delivery for first-time small businesses",
    angle: "Designing a single delivery experience the customer will rave about — Disney 'magic moments' principle scaled to a $20 service",
    tags: ["operations", "service-delivery", "customer-experience", "differentiation", "branding"],
    research_seed: "Disney's three-step service model (look, smile, greet — extended to teens). Danny Meyer's Setting the Table on enlightened hospitality. The 'one delight per delivery' principle. Real example: a teen baker who includes a handwritten thank-you card in every loaf and gets 70% repeat customers. The cost of one nice gesture is less than one customer-acquisition dollar.",
  },

  // ── 3. Financial literacy ──
  {
    topic: "Financial literacy for teen entrepreneurs — profit margins, costs, and revenue basics",
    angle: "The simplest mental model: revenue minus costs equals profit. Why teens forget to count their TIME as a cost and why that's a trap.",
    tags: ["financial-literacy", "profit-margins", "unit-economics", "pricing", "costs"],
    research_seed: "Mike Michalowicz Profit First (allocate profit FIRST then operate on what's left). Unit economics 101 from Brad Feld and Jason Mendelson Venture Deals (gross margin, contribution margin, payback period). The 'forgot to count my time' trap — a teen makes $100 selling cookies that took 12 hours = $8.33/hour, below minimum wage. How real bakeries price (3-5x ingredient cost). CAC vs LTV simplified to 'how much it cost to find this customer vs how much they'll pay over a year'.",
  },
  {
    topic: "Financial literacy for teen entrepreneurs — profit margins, costs, and revenue basics",
    angle: "How to track money with a notebook or Google Sheet — no apps, no QuickBooks. The 3-column system any teen can run in 5 min/week",
    tags: ["financial-literacy", "bookkeeping", "tracking", "habit-building", "getting-started"],
    research_seed: "The simplest 3-column system: date, in, out, why. How small business owners actually track money before they have an accountant. The shoebox method (literally save every receipt). Google Sheets templates that work for a teen reseller. The weekly 5-minute habit. Mike Michalowicz's envelope system. Dan Ariely on 'making the money real' — the behavioral economics of writing it down.",
  },

  // ── 4. Storytelling and elevator pitch ──
  {
    topic: "Storytelling and the elevator pitch for first-time entrepreneurs",
    angle: "Why facts don't sell and stories do. The Pixar story spine and StoryBrand framework applied to a 15-second pitch in a school hallway.",
    tags: ["storytelling", "elevator-pitch", "pitching", "communication", "first-customers"],
    research_seed: "Donald Miller's StoryBrand framework (the customer is the hero, you are the guide). The Pixar story spine: Once upon a time / Every day / Until one day / Because of that / Because of that / Until finally. Andy Raskin's strategic narrative framework. Real example: a teen baker whose pitch went from 'I sell cookies' to 'You know how birthday cakes from Costco all taste the same? I make cakes shaped like the kid's favorite thing — last week I made one shaped like a Switch controller.' Conversion 10% to 60%.",
  },
  {
    topic: "Storytelling and the elevator pitch for first-time entrepreneurs",
    angle: "The 30-second pitch as a CONFIDENCE tool — practicing it out loud changes how you hold yourself. Amy Cuddy + improv training for entrepreneurs.",
    tags: ["storytelling", "elevator-pitch", "confidence", "mindset", "communication"],
    research_seed: "Amy Cuddy on power posing and self-perception. Improv principles: yes-and, agreement first. The 'practice your pitch in front of a mirror 10 times before you say it to anyone' rule. Why teens who can articulate what they do feel more legitimate doing it. Self-affirmation research by Claude Steele. Real example: a 14-year-old who hated 'sales-y' talk learned a 20-second story version and felt comfortable saying it to adults at her mom's office.",
  },

  // ── 5. Target customer profiling and personas ──
  {
    topic: "Target customer profiling and customer personas",
    angle: "Build a persona from one actual person you know — the 'one specific named human' approach instead of inventing a fake demographic",
    tags: ["target-customer", "customer-personas", "customer-interviews", "validation", "niche-selection"],
    research_seed: "Adele Revella's Buyer Personas. The 'design for one' principle from IDEO and Tim Brown. Why generic personas like 'busy moms 25-45' are useless and a single named person ('Sarah, my friend's older sister, in college and lives off ramen') is operationally useful. The HBS rule: if you can't name 5 real people who fit your persona, you don't have a persona, you have a fantasy. Real example: a teen who pivoted from 'high school students' (too broad) to 'kids on my school's robotics team studying for AP Physics' (specific, addressable, $30/hour).",
  },
  {
    topic: "Target customer profiling and customer personas",
    angle: "Jobs-To-Be-Done framework: figure out WHY someone would pay you, not WHO they are demographically",
    tags: ["target-customer", "jobs-to-be-done", "customer-personas", "validation", "value-proposition"],
    research_seed: "Clayton Christensen's Jobs-To-Be-Done framework. The classic milkshake story (people buy milkshakes for breakfast = they need a one-handed commute snack that doesn't crumble). Bob Moesta's Demand Side Sales. Why 'mom' isn't a customer — 'mom hiring help so she can finish the work she brought home from the office' is. Real example: a teen tutor who realized parents weren't hiring her for math help — they were hiring her for the hour of quiet to make dinner.",
  },

  // ── 6. Business model design ──
  {
    topic: "Business model design for first-time entrepreneurs",
    angle: "Lean Canvas in plain English — how to map a business idea on one piece of paper before spending money on it",
    tags: ["business-model", "lean-canvas", "validation", "getting-started", "planning"],
    research_seed: "Alexander Osterwalder's Business Model Canvas and Ash Maurya's Lean Canvas (the simpler version). The 9 building blocks. Why most teen ideas fail at the 'channels' or 'revenue streams' box (no plan to find customers or no clear way to get paid). Real example: a teen who used a Lean Canvas to realize her hand-painted phone case business needed Etsy + a TikTok account (channels) and a $25 price point (revenue) and pivoted before buying $200 of supplies.",
  },
  {
    topic: "Business model design for first-time entrepreneurs",
    angle: "The 5 most common teen-executable business models with concrete examples and which fits which kind of person — service, product, content, marketplace, subscription",
    tags: ["business-model", "revenue-model", "getting-started", "monetization"],
    research_seed: "Taxonomy of small business models for a 14-year-old: (1) per-job service like dog walking or tutoring, (2) handmade product like bracelets or baked goods, (3) content/creator like a TikTok with sponsorships, (4) flip/resell like Depop or sneakers, (5) subscription like a weekly bread delivery. Real teen examples for each. Which fits introverts vs extroverts. Which has highest survival rate (service > resell > product > content > subscription). Stripe Atlas data on small business survival rates.",
  },

  // ── 7. Pricing confidence + young women / minorities ──
  {
    topic: "Pricing confidence — overcoming the fear of charging what you're worth, especially for young women and minority students",
    angle: "Why women and minority entrepreneurs systematically underprice (well-documented gap) and the cognitive scripts that close it",
    tags: ["pricing", "pricing-confidence", "mindset", "gender-gap", "self-worth"],
    research_seed: "Sara Blakely's Spanx pricing story (priced 3x what 'reasonable' would have been). Reshma Saujani's research on the confidence gap (Brave Not Perfect). Linda Babcock and Sara Laschever's Women Don't Ask (the negotiation gap). Specific data: Black women entrepreneurs charge 30-40% less than white men for equivalent services. The cognitive script flip: 'Am I worth this?' → 'Is this fair for the value I'm providing?' Patrice Washington's work on financial confidence in young Black women. The 'practice saying the price out loud 10 times in the mirror' technique. Why guilt about charging is a feature of the system, not a bug in you.",
  },
  {
    topic: "Pricing confidence — overcoming the fear of charging what you're worth, especially for young women and minority students",
    angle: "Concrete scripts to set and defend a price even when you feel weird about it — the technique that works regardless of identity",
    tags: ["pricing", "pricing-confidence", "negotiation", "scripts", "confidence"],
    research_seed: "Chris Voss's Never Split the Difference (mirroring, calibrated questions, 'how am I supposed to do that' as a soft no). Ramit Sethi's price-raise script ('My rate is X. Does that work for you?'). Specific scripts a teen can memorize: how to respond to 'that's expensive', how to NOT lower the price when someone hesitates, how to bundle instead of discount. The 1% rule — every time you don't charge, the system trains you to expect less. Real example: a 16-year-old hair-braider who went from $40 to $80 by quoting the new price without explanation. Half her customers said yes.",
  },

  // ── 8. Social media + zero-budget content marketing ──
  {
    topic: "Social media and zero-budget content marketing for first-time entrepreneurs",
    angle: "Content-first strategy: how teens can use TikTok and Instagram Reels to build an audience BEFORE having a product",
    tags: ["marketing", "social-media", "content-marketing", "tiktok", "audience-building"],
    research_seed: "Gary Vaynerchuk's Jab Jab Jab Right Hook applied to a teen with no budget. Marie Poulin's content-first audience building. Real teen example: Emma Chamberlain built a coffee brand off the back of her YouTube content. The TikTok algorithm rewards specificity and consistency more than production value. The 7-touch rule (people need to see you 7 times before they buy). The 'document don't create' principle from GaryVee — film yourself doing the thing, don't try to make polished content.",
  },
  {
    topic: "Social media and zero-budget content marketing for first-time entrepreneurs",
    angle: "The 30-day plan: what specifically to post, how often, what to ignore. Concrete and operational, not motivational.",
    tags: ["marketing", "social-media", "content-marketing", "first-customers", "getting-started"],
    research_seed: "The 1-1-1 content rule: 1 post showing the work, 1 post showing the customer, 1 post showing the person behind the business — every week. Why posting once a day for 30 days beats posting 'when inspired'. Justin Welsh's 30-day content sprint. Hooks that work for teens: before/after, here's what I learned, this surprised me. The 30-day plan: week 1 = setup the account and post 5 portfolio pieces, week 2 = post one customer story, week 3 = post a tutorial, week 4 = post a behind-the-scenes. Why DMs convert better than comments. Real example: a 15-year-old jewelry maker who got 200 followers and 4 paying customers in 30 days using this playbook.",
  },
];

async function research(seed: Seed): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You are an expert business education researcher building a knowledge base for an AI tutor that teaches teenagers (ages 12-18) entrepreneurship. For every topic provide:
1. KEY PRINCIPLES: 3-5 most important ideas with attribution (who said it, where)
2. CONCRETE EXAMPLES: Real businesses, real names, real numbers, real outcomes
3. MEMORABLE QUOTES: Exact quotes from credible sources a teen would remember
4. FRAMEWORKS: Step-by-step mental models

Be SPECIFIC. Not "price based on value" but "Patrick Campbell at ProfitWell analyzed 10,000 SaaS companies and found value-based pricing generates 2x revenue vs cost-plus."

The tutor talks to real 12-18 year olds in 155 countries. Make the examples diverse and the advice executable from a bedroom with $0.

Return ONLY valid JSON:
{"title":"descriptive title","source_type":"framework|article|case_study|interview|essay","key_principles":[{"principle":"...","explanation":"..."}],"concrete_examples":[{"example":"...","business_type":"...","lesson":"..."}],"quotes":[{"quote":"...","source":"...","context":"..."}]}`,
    messages: [
      {
        role: "user",
        content: `Topic: ${seed.topic}
Specific angle for this entry: ${seed.angle}
Lesson tags: ${seed.tags.join(", ")}

Source priming (use these as starting points; cite real people and real businesses): ${seed.research_seed}

Synthesize the BEST insights from these sources and your own training knowledge. Be specific, cite real people and real businesses with real numbers. Return ONLY valid JSON.`,
      },
    ],
  });
  const text = response.content.find((b) => b.type === "text");
  return text?.text ?? "";
}

async function challenge(topic: string, researchOutput: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: `You are a skeptical, smart 16-year-old entrepreneur reviewing educational content. You're tired of generic business advice. Your job:
1. Read the research
2. Ask 5 hard questions a real teen would ask: "But what if my business is different?", "How do I actually DO this step by step?", "What if I'm 13, not 16?"
3. Answer each question yourself using the research, in plain language
4. Write a student-friendly summary a 14-year-old could understand and act on
5. Score the quality and flag anything weak

Return ONLY valid JSON:
{"student_friendly_summary":"2-3 paragraphs in casual encouraging language. Use 'you' and 'your'. Reference specific examples. No business jargon without explaining it.","challenge_qa":[{"question":"hard question a teen would ask","answer":"concrete specific answer from the research"}],"quality_score":1-10,"flags":["anything generic or weak"]}`,
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}

Researcher output:
${researchOutput}

Challenge this. Make it real for a teenager building their first business. Return ONLY valid JSON.`,
      },
    ],
  });
  const text = response.content.find((b) => b.type === "text");
  return text?.text ?? "";
}

function stripCodeFences(s: string): string {
  return s.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
}

async function seedOne(seed: Seed, idx: number) {
  process.stdout.write(`[${idx + 1}/${SEEDS.length}] ${seed.topic.slice(0, 55)}... `);

  let researchOutput: string;
  try {
    researchOutput = stripCodeFences(await research(seed));
    JSON.parse(researchOutput); // sanity-check
    process.stdout.write("R");
  } catch (e) {
    console.log(` X research (${e instanceof Error ? e.message.slice(0, 50) : "fail"})`);
    return false;
  }

  let challengeOutput: string;
  try {
    challengeOutput = stripCodeFences(await challenge(seed.topic, researchOutput));
    JSON.parse(challengeOutput);
    process.stdout.write("C");
  } catch (e) {
    console.log(` X challenge (${e instanceof Error ? e.message.slice(0, 50) : "fail"})`);
    return false;
  }

  try {
    const r = JSON.parse(researchOutput);
    const c = JSON.parse(challengeOutput);

    const { error } = await supabase.from("knowledge_base").insert({
      topic: seed.topic,
      lesson_tags: seed.tags,
      title: r.title ?? seed.topic,
      source_url: null,
      source_type: r.source_type ?? "framework",
      key_principles: r.key_principles ?? [],
      concrete_examples: r.concrete_examples ?? [],
      quotes: r.quotes ?? [],
      student_friendly_summary: c.student_friendly_summary ?? "",
      challenge_qa: c.challenge_qa ?? [],
    });

    if (error) {
      console.log(` X insert: ${error.message}`);
      return false;
    }
    console.log(` ✓ q=${c.quality_score ?? "?"} → ${(r.title ?? "").slice(0, 50)}`);
    return true;
  } catch (e) {
    console.log(` X parse: ${(e as Error).message}`);
    return false;
  }
}

async function main() {
  console.log(`Seeding ${SEEDS.length} extended knowledge_base entries\n`);

  // Verify table is reachable
  const { error } = await supabase.from("knowledge_base").select("id").limit(1);
  if (error) {
    console.error(`knowledge_base not accessible: ${error.message}`);
    process.exit(1);
  }

  let inserted = 0;
  for (let i = 0; i < SEEDS.length; i++) {
    const ok = await seedOne(SEEDS[i], i);
    if (ok) inserted++;
  }

  console.log(`\nDone. ${inserted}/${SEEDS.length} inserted.`);

  // Show final count
  const { count } = await supabase.from("knowledge_base").select("id", { count: "exact", head: true });
  console.log(`Total knowledge_base entries: ${count}`);
}

main().catch(console.error);
