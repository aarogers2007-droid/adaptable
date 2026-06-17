/**
 * Seed Larry's Brain — Module 1 frameworks into the org-isolated knowledge_base.
 *
 * Hand-structured from Larry's Phase 1 booklet (faithful to the source; principles
 * + his own lines; no invented stats). Tag-retrieved by the brain-chat mentor.
 * verified=true (hand-verified against the source pages). No embeddings yet —
 * retrieval is by lesson_tag; embeddings get backfilled when semantic search lands.
 *
 * Usage: node --env-file=.env.local scripts/seed-larry-brain.mjs
 */
import { createClient } from "@supabase/supabase-js";

const LARRY_ORG = "7857e627-6e92-4a07-b19f-dbf25e9b6ce8";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const entries = [
  {
    lesson_tags: ["brain-m1-l1-worry-model"],
    topic: "worry and fear",
    title: "The Worry Model",
    student_friendly_summary:
      "A simple decision tree for any worry. Do you have a problem? If no, there's nothing to worry about. If yes, can you do something about it? If yes, act — the worry has done its job. If no, worrying changes nothing. Every path ends the same place: don't worry.",
    key_principles: [
      { principle: "Sort it, don't stew on it", explanation: "Run any worry through one question — can you act on it or not?" },
      { principle: "Action ends worry", explanation: "If you can do something, do it; worry's only job was to point you at the problem." },
      { principle: "Acceptance ends worry", explanation: "If you can't do anything about it, worrying changes nothing — let it go." },
    ],
    quotes: [
      "Worry is using your imagination to create something you don't want.",
      "How is it possible to worry about something that hasn't even happened yet?",
      "Today is the tomorrow that you worried about yesterday.",
    ],
    concrete_examples: [
      { example: "Create your future, don't live in your past — did you drive here today looking in your rear-view mirror?" },
    ],
  },
  {
    lesson_tags: ["brain-m1-l2-fear"],
    topic: "worry and fear",
    title: "Anxiety, Fear & Worry",
    student_friendly_summary:
      "Fear is a built-in defense (fight, flight, freeze) and can be a useful friend — but most of what we fear isn't real. The skill is choosing one thought over another.",
    key_principles: [
      { principle: "Fear is a friend, not a master", explanation: "It keeps you out of the lion's cage, but it shouldn't run your life." },
      { principle: "Most fear isn't true", explanation: "Anxiety feels real but usually isn't." },
      { principle: "Choose your thought", explanation: "The weapon against stress is choosing one thought over another." },
      { principle: "Failure is an event, not a person", explanation: "You don't fail — you learn." },
    ],
    quotes: [
      "Fear is only found in one place — between your ears.",
      "Fear puts you in one of three states — fight, flight, freeze.",
      "Your anxiety may feel real, but most of the time it's just not true.",
      "The weapon against stress is our ability to choose one thought over another.",
      "Failure is an event, not a person.",
      "Fear is actually a good friend — it's what keeps you out of the lion's cage.",
      "What percent of bad days have you survived so far?",
    ],
    concrete_examples: [],
  },
  {
    lesson_tags: ["brain-m1-l3-band-aid-scale"],
    topic: "perspective",
    title: "The Band-Aid Scale",
    student_friendly_summary:
      "Right-size your problems. Before you react, rate how bad something really is from 0 to 100%. On the physical scale, 100% is losing all four limbs and 10% is a band-aid cut. The emotional scale is yours to fill — and most daily upsets land far lower than they feel in the moment.",
    key_principles: [
      { principle: "Rate it before you react", explanation: "Put a number on how bad it actually is." },
      { principle: "Most things are band-aids", explanation: "Daily frustrations rank far lower than the panic they trigger." },
      { principle: "Your scale is yours", explanation: "You decide where a loss, a setback, or a flat tire really sit." },
    ],
    quotes: [],
    concrete_examples: [
      { example: "Sample emotional scale from the material: losing a loved one ~100%, losing your job ~90%, a divorce ~80%, a best friend leaving ~70%, a flat tire ~40%, an ink stain on your pants ~30%, spilled milk ~20%, a lost pencil ~10%." },
    ],
  },
  {
    lesson_tags: ["brain-m1-l4-circle-of-focus"],
    topic: "focus and control",
    title: "Circle of Focus",
    student_friendly_summary:
      "Picture three rings: what you Control (the inner ring), what you Influence (the middle ring), and Concerns you can't change (the outer ring). Spend your energy in the inner two and release the outer one.",
    key_principles: [
      { principle: "Control is the inner ring", explanation: "Act on what is fully yours." },
      { principle: "Influence is the middle ring", explanation: "You can affect it, not command it — engage where you can move the needle." },
      { principle: "Concerns are the outer ring", explanation: "Worrying here drains you and changes nothing." },
      { principle: "Energy follows attention", explanation: "Deliberately move your effort inward." },
    ],
    quotes: [],
    concrete_examples: [],
  },
  {
    lesson_tags: ["brain-m1-l5-focus"],
    topic: "focus and control",
    title: "You Get What You Focus On",
    student_friendly_summary:
      "We move toward what we focus on. Point your attention at the outcome you want, not the mistake you're afraid of.",
    key_principles: [
      { principle: "Attention shapes outcome", explanation: "You get what you focus on, so be mindful of where you put your focus." },
      { principle: "Focus on the win, not the error", explanation: "Don't focus on the turnover — focus on being in position for the no-look pass." },
      { principle: "It compounds", explanation: "Where your focus goes day after day grooves itself in." },
    ],
    quotes: [
      "You get what you focus on — so be mindful of where you are putting your focus.",
      "If you want fewer turnovers, don't focus on turnovers; focus on being in position for the no-look pass.",
    ],
    concrete_examples: [
      { example: "A coaching story in the material: a team that reviewed its successes outperformed an equally-matched team that kept reviewing its mistakes." },
    ],
  },
];

const allTags = entries.flatMap((e) => e.lesson_tags);

// Idempotent: clear prior Module 1 seed rows for this org, then insert fresh.
const { error: delErr } = await sb
  .from("knowledge_base")
  .delete()
  .eq("org_id", LARRY_ORG)
  .overlaps("lesson_tags", allTags);
if (delErr) { console.error("delete failed:", delErr.message); process.exit(1); }

const rows = entries.map((e) => ({
  org_id: LARRY_ORG,
  topic: e.topic,
  title: e.title,
  lesson_tags: e.lesson_tags,
  source_type: "framework",
  source_url: null,
  key_principles: e.key_principles,
  concrete_examples: e.concrete_examples,
  quotes: e.quotes,
  student_friendly_summary: e.student_friendly_summary,
  challenge_qa: [],
  verified: true,
}));

const { data, error } = await sb.from("knowledge_base").insert(rows).select("id,title,lesson_tags");
if (error) { console.error("insert failed:", error.message); process.exit(1); }
console.log(`Seeded ${data.length} Module 1 frameworks for Larry's Brain:`);
data.forEach((r) => console.log(`  ✓ ${r.title} [${r.lesson_tags.join(", ")}]`));
