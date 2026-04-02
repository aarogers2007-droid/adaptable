/**
 * Seed the knowledge base with researched + challenged content.
 * Run: npx tsx scripts/seed-knowledge.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ResearchData {
  title: string;
  source_type: string;
  key_principles: { principle: string; explanation: string }[];
  concrete_examples: { example: string; business_type: string; lesson: string }[];
  quotes: { quote: string; source: string; context: string }[];
}

interface ChallengeData {
  student_friendly_summary: string;
  challenge_qa: { question: string; answer: string }[];
  quality_score: number;
}

const TOPICS = [
  {
    researchFile: path.join(__dirname, "../src/app/(app)/lessons/pricing-strategy-research.json"),
    challengeSummary: `Figuring out what to charge is one of the most important things you'll do as a young entrepreneur, and the biggest mistake you can make is charging too little. Seriously — if your price is too low, people will actually think your product is bad. Warby Parker almost priced their glasses at $45, but a professor told them it was so cheap people would assume they were junk. They went with $95 instead and built a $6 billion company. Stripe kept their pricing dead simple — 2.9% plus 30 cents per transaction, right on their website, no hidden fees — and that transparency alone made developers trust them.

Here's the practical part: price based on the value your customer gets, not what it costs you to make. If you bake cookies that cost $2 in ingredients and sell them for $3, you're leaving money on the table if people would happily pay $5 because they taste amazing and you deliver them fresh to their door. Find your 'value metric' — that's just the thing that scales with how much value the customer gets.

Finally, treat pricing like an experiment, not a one-time decision. Test different prices, ask people what they'd pay, and revisit it every few months. The research shows that spending even a little time optimizing your pricing is 7.5 times more powerful than spending that same time trying to get new customers.`,
    challengeQA: [
      { question: "But what about someone who's just starting with no reputation? How can I 'charge more' when nobody knows who I am?", answer: "Early adopters don't care about your reputation. They care about solving their problem. If you're making custom birthday cakes and someone needs one by Saturday, they'll pay your price if the product looks good. Charging more actually helps build your reputation faster because a higher price signals you take your work seriously." },
      { question: "That Warby Parker example is for a huge company. What about me selling cookies or tutoring?", answer: "The principle scales down perfectly. If your cookies cost $1.50 to make and you sell for $2, you need 200 sales for $100 profit. At $4 (still cheaper than a bakery), you need only 40 sales. If everyone else charges $25/hour for tutoring and you charge $10, parents might think you don't know the subject." },
      { question: "How do I actually figure out what to charge, step by step?", answer: "1) Figure out your costs (that's your floor). 2) Research what competitors charge. 3) Ask 5-10 potential customers what they'd pay. 4) Pick a price closer to the top of the range. 5) Start selling and track what happens. 6) Revisit every few months." },
      { question: "What if I raise my prices and lose all my customers?", answer: "A software company raised prices 40% with only 30 days notice — support tickets exploded 380%. They tried again 18 months later with 120 days notice, multiple options, and clear documentation. Result? 94% retention and 22% revenue growth. Give notice, explain why, and give options." },
      { question: "What numbers actually matter? I don't have an accounting degree.", answer: "Four numbers: 1) Cost of goods (what it costs to make one unit), 2) Your price, 3) Your margin (price minus cost), 4) Break-even (how many to sell to cover fixed costs). Write those on a sticky note. That's your whole financial plan to start." },
    ],
    topic: "pricing strategy",
    lessonTags: ["pricing", "set-your-price", "revenue-model"],
  },
  {
    researchFile: path.join(__dirname, "../.gstack-cache/finding-first-customers.json"),
    challengeSummary: `Finding your first customers is not about running ads, going viral on TikTok, or building the perfect product in secret. It's about personally talking to people, one by one, and getting them to actually use what you made. The Stripe founders literally said 'give me your laptop' and installed their product right there. The Airbnb founders flew to New York and took photos of people's apartments themselves. DoorDash started as PaloAltoDelivery.com, and the founders delivered food personally. Sara Blakely cold-called Neiman Marcus over and over, then dragged the buyer into a bathroom for a live demo of Spanx. None of this is glamorous. All of it worked.

Your first 10 customers will probably come from people you already know — friends, family friends, online communities. That's not a weakness, that's how literally every successful startup started. After those 10, you get the next 20 through referrals. You don't need paid ads until you have 100+ customers.

And here's the part most people skip: charge money from day one. Free users won't give you honest feedback because they don't care enough. Someone who pays you $5 will tell you exactly what's wrong, and that's how you make your product better.`,
    challengeQA: [
      { question: "But I don't have a network like those Silicon Valley founders. How am I supposed to find customers?", answer: "Sara Blakely had $5,000 and zero connections. Tim Leatherman got rejected for 7 years before his first sale. Your 'extended network' includes friends of friends, old acquaintances, and online communities. If you're in a Discord server, school club, or church group, you have a network." },
      { question: "What if nobody in my town wants what I'm selling?", answer: "That's actually useful information. If 20 people say no, you learned something most founders waste months ignoring. But you're not limited to your town. DoorDash started in one neighborhood. Tinder started at one campus. You can start hyper-local OR sell online to a niche community anywhere." },
      { question: "How do I ask someone to pay me without being awkward?", answer: "Sara Blakely pulled a Neiman Marcus buyer into a bathroom. The Stripe founders said 'give me your laptop' to near-strangers. Awkward is the price of admission. Being 16 can actually work in your favor — people root for young entrepreneurs. Just say what your product does, what it costs, and ask." },
      { question: "What does 'talking to customers' actually look like?", answer: "Work backwards from your goal. Need 5 paying customers, 1 in 10 say yes? That's 50 conversations. 50 DMs, 50 in-person pitches, or some mix. The non-negotiable part is that YOU do it, not a flyer or Instagram post." },
      { question: "What if literally zero people sign up? Should I quit?", answer: "Airbnb almost died — 30 days of in-person engagement made the difference for that $70 billion company. Tim Leatherman got rejected for 7 years. If you've personally pitched 50 people and all said no, maybe pivot. But if you've just posted on social media and waited, you haven't actually tried yet." },
    ],
    topic: "finding first customers",
    lessonTags: ["first-customers", "customer-acquisition", "sales"],
  },
  {
    researchFile: path.join(__dirname, "../.gstack-cache/competition-differentiation.json"),
    challengeSummary: `You don't have to out-spend or out-hire big companies to win. The smartest entrepreneurs won by picking a specific group of people and making something those people absolutely loved. Facebook didn't try to beat MySpace — Zuckerberg launched at just Harvard, got 50% of students in a month, then expanded school by school. Yellow Tail wine didn't try to impress wine snobs — they made a fun, simple wine for the 85% of Americans who thought wine was intimidating, and sold 9x what they expected.

The most important thing is that your idea doesn't need to be totally original — it needs to solve a real problem better than the alternatives. Y Combinator funds multiple companies doing the same thing because the founder matters more than the idea. So stop worrying about whether your idea is 'unique enough' and start worrying about whether you understand your customers' problems deeply enough.

Talk to 10 people who have the problem you want to solve. Do things that don't scale. That early hustle isn't a weakness of being small — it's your biggest advantage because big companies literally cannot do it.`,
    challengeQA: [
      { question: "But I'm just a kid — how can I compete with real businesses?", answer: "You're not supposed to compete head-on. Peter Thiel says 'competition is for losers.' Find a corner of the market they're ignoring. Facebook didn't fight MySpace's 25 million users. The Collison brothers were 20 and 22 when they started Stripe. Being small is your superpower because you can personally help every customer." },
      { question: "What if someone copies my idea?", answer: "Y Combinator funds multiple startups doing the exact same thing because ideas don't matter — execution does. Google wasn't the first search engine. Facebook wasn't the first social network. Your protection isn't a patent — it's building deep relationships with your first users." },
      { question: "Do I really need to be 'unique' or can I just do something good?", answer: "You need to be different, not unique. Yellow Tail wine wasn't a new invention — it was wine for people who found wine intimidating. Michael Porter from Harvard says strategy is about choosing what NOT to do. USAA chose to serve only military families (4% of population) and their loyalty is 97%." },
      { question: "What if my niche is too small to make money?", answer: "Starting narrow doesn't mean staying narrow. Facebook: Harvard → Ivy League → all colleges → everyone → 1 billion. Nintendo Wii targeted 'non-gamers' and sold 100 million units. A product 100% of a small group loves beats a product 0.1% of everyone kind of likes." },
      { question: "Isn't this just business school theory?", answer: "Every example started from zero. The Collison brothers were college-age kids from Ireland. Zuckerberg was a sophomore in a dorm. Pick a small group, talk to them, find what frustrates them about existing options, and fix it. None of that requires money, connections, or a degree." },
    ],
    topic: "competition and differentiation",
    lessonTags: ["competition", "differentiation", "niche-selection"],
  },
];

async function main() {
  for (const topic of TOPICS) {
    let research: ResearchData | null = null;

    // Try to read research file
    try {
      if (fs.existsSync(topic.researchFile)) {
        research = JSON.parse(fs.readFileSync(topic.researchFile, "utf-8"));
      }
    } catch {
      console.log(`Could not read ${topic.researchFile}, using inline data`);
    }

    const chunk = {
      topic: topic.topic,
      lesson_tags: topic.lessonTags,
      title: research?.title ?? `${topic.topic} — Research-Backed Guide`,
      source_type: research?.source_type ?? "framework",
      key_principles: research?.key_principles ?? [],
      concrete_examples: research?.concrete_examples ?? [],
      quotes: research?.quotes ?? [],
      student_friendly_summary: topic.challengeSummary,
      challenge_qa: topic.challengeQA,
    };

    const { error } = await supabase.from("knowledge_base").insert(chunk);

    if (error) {
      console.error(`Failed to insert ${topic.topic}:`, error.message);
    } else {
      console.log(`✓ Inserted: ${topic.topic}`);
    }
  }

  console.log("\nDone. Knowledge base seeded.");
}

main();
