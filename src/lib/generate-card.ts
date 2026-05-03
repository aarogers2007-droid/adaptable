import "server-only";

import { sendMessage } from "@/lib/ai";
import { moderateOutput } from "@/lib/output-moderation";
import { getArchetypeTitle } from "@/lib/archetype-titles";

// ── Types ──

export interface CardContent {
  title: string;
  description: string;
  insights: {
    wish: string;
    mind: string;
    lens: string;
    scale: string;
    voice: string;
  };
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
The description and insights must feel like they could only have been written for someone with this title — not for any of the other 19 titles.

STUDENT'S RESPONSES:
- Circle 1 (The Wish — what they want to work on): ${CATEGORY_LABELS[input.circle_1_category] ?? input.circle_1_category}
- Circle 2 (The Mind — how they approach problems): ${ARCHETYPE_LABELS[input.circle_2_archetype] ?? input.circle_2_archetype}
- Circle 3 (The Lens — what they know deeply): ${circle3Display}
- Circle 4 (The Scale — scope of their ambition): ${SCALE_LABELS[input.circle_4_scale] ?? input.circle_4_scale}
- Circle 5 (The Voice — how they communicate): ${input.circle_5_voice?.join(", ") || "(none selected)"}

VOCABULARY CALIBRATION: ${vocabNote}

RULES:
1. Write a one-sentence description of who this person is as a thinker and human being. NOT as an inventor, entrepreneur, or builder. A character description. One sentence, ending with a period. No internal periods or semicolons.

2. Write five insight lines — one per circle, one sentence each, each ending with a period. Insights are OBSERVATIONS about the person, not restatements of their answers.
   - WRONG: "You want to create a physical product."
   - RIGHT: "You want to be able to hold what you made."
   - WRONG: "You are a Builder archetype."
   - RIGHT: "Your first instinct when something is broken is to figure out how to fix it yourself."

3. Circle 3 (The Lens) may contain free text. If the input is thin or unusual, write an insight that reflects the breadth of curiosity implied without fabricating specifics. Do not make up knowledge domains the student didn't mention.

4. BANNED WORDS — do not use any of these in any field: invent, inventor, startup, entrepreneur, entrepreneurship, business, product, build, create, design, innovate, innovation. Find different words entirely.

5. Write as if describing a person to someone who respects them. Not a resume. Not a profile. A recognition.

OUTPUT: Respond with ONLY this JSON structure, no markdown, no prose, no explanation:
{"description":"string","insights":{"wish":"string","mind":"string","lens":"string","scale":"string","voice":"string"}}`;
}

// ── Validation pipeline ──

function validateCardJSON(raw: string): { parsed: CardContent["insights"] & { description: string } } | { error: string } {
  // Step 1: Parse JSON
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "JSON parse failed" };
  }

  // Step 2: Schema validation
  const desc = parsed.description;
  const insights = parsed.insights as Record<string, unknown> | undefined;
  if (typeof desc !== "string" || !desc.trim()) return { error: "Missing description" };
  if (!insights || typeof insights !== "object") return { error: "Missing insights object" };

  const requiredKeys = ["wish", "mind", "lens", "scale", "voice"] as const;
  for (const key of requiredKeys) {
    if (typeof insights[key] !== "string" || !(insights[key] as string).trim()) {
      return { error: `Missing or empty insight: ${key}` };
    }
  }

  // Step 3: Sentence validation (one terminal period, no internal periods or semicolons)
  const allFields = [
    { name: "description", value: desc as string },
    ...requiredKeys.map((k) => ({ name: k, value: insights[k] as string })),
  ];

  for (const field of allFields) {
    const trimmed = field.value.trim();
    if (!trimmed.endsWith(".")) return { error: `${field.name} does not end with a period` };
    const inner = trimmed.slice(0, -1);
    if (inner.includes(".") || inner.includes(";")) {
      return { error: `${field.name} contains internal period or semicolon` };
    }
  }

  // Step 4: Banned word check
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
      description: desc as string,
      wish: insights.wish as string,
      mind: insights.mind as string,
      lens: insights.lens as string,
      scale: insights.scale as string,
      voice: insights.voice as string,
    },
  };
}

// Step 6: Coherence check (advisory, does not trigger retry)
function coherenceCheck(title: string, description: string): string | null {
  const lower = description.toLowerCase();
  // If title implies intimate scale (Artisan, Anchor, etc.) but description says "world"
  const intimateTitles = ["The Artisan", "The Anchor", "The Decoder", "The Gateway", "The Chronicle"];
  if (intimateTitles.includes(title) && /\b(world|global|planet|humanity|everyone)\b/i.test(lower)) {
    return `Coherence warning: title "${title}" implies intimate scale but description mentions world-level impact`;
  }
  // If title implies world scale but description is overly small
  const worldTitles = ["The Frontier", "The Pulse", "The Cartographer", "The Nexus", "The Legend"];
  if (worldTitles.includes(title) && /\b(one person|single individual|just one)\b/i.test(lower)) {
    return `Coherence warning: title "${title}" implies world scale but description mentions single-person impact`;
  }
  return null;
}

// ── Main generation function ──

const RETRY_PREFIX = `Your previous response failed validation. Ensure your output is valid JSON, contains no internal periods or semicolons in any field, and uses none of these words: invent, inventor, startup, entrepreneur, entrepreneurship, business, product, build, create, design, innovate, innovation.\n\n`;

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
        if (attempt === 0) continue; // retry once
        return { card: null, error: lastError, usage: result.usage };
      }

      const { parsed } = validation;

      // Step 6: Coherence check (advisory only)
      const coherence = coherenceCheck(title, parsed.description);
      if (coherence) {
        console.warn(`[generate-card] ${coherence}`);
      }

      return {
        card: {
          title,
          description: parsed.description.trim(),
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
