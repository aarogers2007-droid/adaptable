import "server-only";

import { sendMessage } from "@/lib/ai";
import { moderateOutput } from "@/lib/output-moderation";
import { getArchetypeTitle } from "@/lib/archetype-titles";

// ── Types ──

export interface CardContent {
  title: string;
  portrait: string;
  edge: string;
  watch_out: string;
  insights: {
    wish: string;
    mind: string;
    lens: string;
    scale: string;
    voice: string;
  };
  /** Backward compat: old cards stored `description` instead of portrait/edge/watch_out */
  description?: string;
}

interface GenerateCardInput {
  circle_1_category: string;
  circle_2_archetype: string;
  circle_3_chips: string[];
  circle_3_freetext: string | null;
  circle_4_scale: string;
  circle_5_voice: string[];
  grade_tier: string;
}

interface GenerateCardResult {
  card: CardContent | null;
  error: string | null;
  usage: { input_tokens: number; output_tokens: number } | null;
}

// ── Banned words ──

const BANNED_WORDS = [
  "invent", "inventor", "startup", "entrepreneur",
  "entrepreneurship", "business", "product", "build",
  "create", "design", "innovate", "innovation",
];

const BANNED_REGEX = new RegExp(
  `\\b(${BANNED_WORDS.join("|")})\\b`,
  "i"
);

// ── Label lookups for the prompt ──

const CATEGORY_LABELS: Record<string, string> = {
  physical: "A physical product",
  digital: "A digital tool or app",
  medical: "A medical or health innovation",
  learning: "A learning tool",
  environmental: "An environmental solution",
  social: "A social or community tool",
  transport: "A transportation or infrastructure invention",
  wildcard: "Something that doesn't fit any category",
};

const ARCHETYPE_LABELS: Record<string, string> = {
  builder: "Builder — thinks about how to make it, wants to know how it works",
  empath: "Empath — thinks about the people affected first, wants to understand how they feel",
  systems_thinker: "Systems Thinker — asks why the problem exists, wants to understand what broke",
  connector: "Connector — looks for what already exists that could be combined or repurposed",
  storyteller: "Storyteller — thinks about how to make people care, finds the words or images",
};

const SCALE_LABELS: Record<string, string> = {
  one_person: "A — One person's life is completely transformed",
  community: "B — A small community finally has something they always needed",
  generation: "C — A whole generation of kids grows up with something we never had",
  world: "D — Something that changes the world",
};

const GRADE_VOCABULARY: Record<string, string> = {
  lower_elementary: "Use simple, concrete words a 7-year-old would understand. Short sentences. No abstractions.",
  upper_elementary: "Use clear, direct language a 10-year-old would understand. One idea per sentence.",
  middle_school: "Write at an 8th-grade reading level. Be specific and grounded.",
  high_school: "Write naturally for a teenager. Be honest and specific. No dumbing down.",
};

// ── System prompt ──

function buildSystemPrompt(input: GenerateCardInput, title: string): string {
  const circle3Display = [
    ...(input.circle_3_chips ?? []),
    ...(input.circle_3_freetext ? [input.circle_3_freetext] : []),
  ].join(", ") || "(no specific knowledge areas selected)";

  const vocabNote = GRADE_VOCABULARY[input.grade_tier] ?? GRADE_VOCABULARY.high_school;

  return `You are writing a character card for a young person. This card will be read by the student themselves, their parent, and their educator. It describes who this person IS — how they think, what drives them, what they notice — not what they do or want to make.

TITLE: "${title}"
The entire card must feel like it could only have been written for someone with this title — not for any of the other 19 titles.

STUDENT'S RESPONSES:
- Circle 1 (The Wish — what they want to work on): ${CATEGORY_LABELS[input.circle_1_category] ?? input.circle_1_category}
- Circle 2 (The Mind — how they approach problems): ${ARCHETYPE_LABELS[input.circle_2_archetype] ?? input.circle_2_archetype}
- Circle 3 (The Lens — what they know deeply): ${circle3Display}
- Circle 4 (The Scale — scope of their ambition): ${SCALE_LABELS[input.circle_4_scale] ?? input.circle_4_scale}
- Circle 5 (The Voice — how they communicate): ${input.circle_5_voice?.join(", ") || "(none selected)"}

VOCABULARY CALIBRATION: ${vocabNote}

BEFORE WRITING: Read all five circles together. Look for how they interact. The portrait comes from the intersections — not the individual answers.

OUTPUT STRUCTURE (four sections):

1. PORTRAIT — Three to four sentences that synthesize all five circles into a cohesive description of how this student thinks and operates. This is NOT a list of circle answers restated in prose. It is a genuine synthesis — the paragraph should say something true about the student that could not be derived from reading any single circle in isolation. The student should read this and feel accurately seen.

2. EDGE — One to two sentences identifying the specific combination of circles that makes this student unusual or particularly well-suited for something. This is the cross-circle insight — what emerges from how two or more circles interact that would not be obvious from any circle individually. Not a generic strength. A specific observation about this particular combination.

3. WATCH OUT — One sentence. The honest tension or blind spot that this particular combination of circles tends to produce. Not a flaw. A genuine pattern worth being aware of. Written with respect.

4. INSIGHTS — Five lines, one per circle. Each is a one-sentence interpretation of what that circle answer reveals about this student specifically, written in the context of everything else the card knows about them. The Circle 3 insight for a Systems Thinker reads differently than the Circle 3 insight for an Empath with the same knowledge area.

RULES:
1. Do NOT start the portrait with the archetype title. Do NOT use "You are" as the first two words.
2. Never enumerate circles explicitly — never write "your Circle 3 shows" or "based on your scale answer."
3. Write about the student, not about their answers.
4. Every sentence must be specific to THIS combination of circles. No sentence should be true of any student regardless of their answers.
5. Insights are OBSERVATIONS about the person, not restatements of their answers.
   - WRONG: "You want to create a physical product."
   - RIGHT: "You want to be able to hold what you made."
6. Circle 3 (The Lens) may contain free text. If the input is thin, reflect the breadth of curiosity implied without fabricating specifics.
7. BANNED WORDS — do not use: invent, inventor, startup, entrepreneur, entrepreneurship, business, product, build, create, design, innovate, innovation. Find different words entirely.
8. Write as if describing a person to someone who respects them. Not a resume. Not a profile. A recognition.

OUTPUT: Respond with ONLY this JSON structure, no markdown, no prose, no explanation:
{"portrait":"3-4 sentences here.","edge":"1-2 sentences here.","watch_out":"1 sentence here.","insights":{"wish":"string","mind":"string","lens":"string","scale":"string","voice":"string"}}`;
}

// ── Validation pipeline ──

interface ParsedCard {
  portrait: string;
  edge: string;
  watch_out: string;
  wish: string;
  mind: string;
  lens: string;
  scale: string;
  voice: string;
}

function validateCardJSON(raw: string): { parsed: ParsedCard } | { error: string } {
  // Step 1: Parse JSON
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "JSON parse failed" };
  }

  // Step 2: Schema validation
  const portrait = parsed.portrait;
  const edge = parsed.edge;
  const watchOut = parsed.watch_out;
  const insights = parsed.insights as Record<string, unknown> | undefined;

  if (typeof portrait !== "string" || !portrait.trim()) return { error: "Missing portrait" };
  if (typeof edge !== "string" || !edge.trim()) return { error: "Missing edge" };
  if (typeof watchOut !== "string" || !watchOut.trim()) return { error: "Missing watch_out" };
  if (!insights || typeof insights !== "object") return { error: "Missing insights object" };

  const requiredKeys = ["wish", "mind", "lens", "scale", "voice"] as const;
  for (const key of requiredKeys) {
    if (typeof insights[key] !== "string" || !(insights[key] as string).trim()) {
      return { error: `Missing or empty insight: ${key}` };
    }
  }

  // Step 3: Sentence validation
  // Portrait: 3-4 sentences allowed (internal periods OK)
  const portraitTrimmed = (portrait as string).trim();
  if (!portraitTrimmed.endsWith(".")) return { error: "portrait does not end with a period" };
  const portraitSentences = portraitTrimmed.split(/\.\s+/).filter(Boolean);
  if (portraitSentences.length < 2) return { error: "portrait must have at least 2 sentences" };

  // Edge: 1-2 sentences allowed
  const edgeTrimmed = (edge as string).trim();
  if (!edgeTrimmed.endsWith(".")) return { error: "edge does not end with a period" };

  // Watch out: exactly 1 sentence (no internal periods)
  const watchOutTrimmed = (watchOut as string).trim();
  if (!watchOutTrimmed.endsWith(".")) return { error: "watch_out does not end with a period" };
  const watchOutInner = watchOutTrimmed.slice(0, -1);
  if (watchOutInner.includes(".") || watchOutInner.includes(";")) {
    return { error: "watch_out must be exactly one sentence" };
  }

  // Insights: each exactly 1 sentence
  for (const key of requiredKeys) {
    const val = (insights[key] as string).trim();
    if (!val.endsWith(".")) return { error: `${key} does not end with a period` };
    const inner = val.slice(0, -1);
    if (inner.includes(".") || inner.includes(";")) {
      return { error: `${key} contains internal period or semicolon` };
    }
  }

  // Step 4: Banned word check
  const allFields = [
    { name: "portrait", value: portrait as string },
    { name: "edge", value: edge as string },
    { name: "watch_out", value: watchOut as string },
    ...requiredKeys.map((k) => ({ name: k, value: insights[k] as string })),
  ];

  for (const field of allFields) {
    if (BANNED_REGEX.test(field.value)) {
      const match = field.value.match(BANNED_REGEX);
      return { error: `Banned word "${match?.[0]}" found in ${field.name}` };
    }
  }

  // Step 5: Output moderation
  for (const field of allFields) {
    const modResult = moderateOutput(field.value);
    if (!modResult.safe) {
      return { error: `Output moderation flagged ${field.name}: ${modResult.reason}` };
    }
  }

  return {
    parsed: {
      portrait: portrait as string,
      edge: edge as string,
      watch_out: watchOut as string,
      wish: insights.wish as string,
      mind: insights.mind as string,
      lens: insights.lens as string,
      scale: insights.scale as string,
      voice: insights.voice as string,
    },
  };
}

// Step 6: Coherence check (advisory, does not trigger retry)
function coherenceCheck(title: string, portrait: string): string | null {
  const lower = portrait.toLowerCase();
  const intimateTitles = ["The Artisan", "The Anchor", "The Decoder", "The Gateway", "The Chronicle"];
  if (intimateTitles.includes(title) && /\b(world|global|planet|humanity|everyone)\b/i.test(lower)) {
    return `Coherence warning: title "${title}" implies intimate scale but portrait mentions world-level impact`;
  }
  const worldTitles = ["The Frontier", "The Pulse", "The Cartographer", "The Nexus", "The Legend"];
  if (worldTitles.includes(title) && /\b(one person|single individual|just one)\b/i.test(lower)) {
    return `Coherence warning: title "${title}" implies world scale but portrait mentions single-person impact`;
  }
  return null;
}

// ── Main generation function ──

const RETRY_PREFIX = `Your previous response failed validation. Ensure your output is valid JSON with exactly these keys: portrait, edge, watch_out, insights (with wish, mind, lens, scale, voice). watch_out and each insight must be exactly one sentence ending with a period. Do not use: invent, inventor, startup, entrepreneur, entrepreneurship, business, product, build, create, design, innovate, innovation.\n\n`;

export async function generateCardContent(input: GenerateCardInput): Promise<GenerateCardResult> {
  const title = getArchetypeTitle(input.circle_2_archetype, input.circle_4_scale);
  const baseSystemPrompt = buildSystemPrompt(input, title);

  const userMessage = "Generate the character card now.";

  let lastError = "";

  for (let attempt = 0; attempt < 2; attempt++) {
    const systemPrompt = attempt === 0 ? baseSystemPrompt : RETRY_PREFIX + baseSystemPrompt;

    try {
      const result = await sendMessage({
        feature: "card",
        systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      const validation = validateCardJSON(result.text);

      if ("error" in validation) {
        lastError = `Attempt ${attempt + 1}: ${validation.error}`;
        console.warn(`[generate-card] Validation failed (attempt ${attempt + 1}):`, validation.error);
        if (attempt === 0) continue;
        return { card: null, error: lastError, usage: result.usage };
      }

      const { parsed } = validation;

      // Step 6: Coherence check (advisory only)
      const coherence = coherenceCheck(title, parsed.portrait);
      if (coherence) {
        console.warn(`[generate-card] ${coherence}`);
      }

      return {
        card: {
          title,
          portrait: parsed.portrait.trim(),
          edge: parsed.edge.trim(),
          watch_out: parsed.watch_out.trim(),
          insights: {
            wish: parsed.wish.trim(),
            mind: parsed.mind.trim(),
            lens: parsed.lens.trim(),
            scale: parsed.scale.trim(),
            voice: parsed.voice.trim(),
          },
        },
        error: null,
        usage: result.usage,
      };
    } catch (err) {
      lastError = `Attempt ${attempt + 1}: ${err instanceof Error ? err.message : "Unknown API error"}`;
      console.error(`[generate-card] API error (attempt ${attempt + 1}):`, err);
      if (attempt === 0) continue;
      return { card: null, error: lastError, usage: null };
    }
  }

  return { card: null, error: lastError, usage: null };
}
