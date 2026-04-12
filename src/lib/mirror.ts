import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Founder's Mirror — prompt generation
//
// The Mirror is a brief, non-directive reflection prompt shown in the
// Founder's Log. It states one factual observation and asks one question.
// No advice, praise, reframing, encouragement, or suggestions — ever.
// ---------------------------------------------------------------------------

const anthropic = new Anthropic();

// --- Types ------------------------------------------------------------------

export interface MirrorContext {
  triggerType: "lesson_completion" | "return_from_absence" | "weekly_review";
  lessonTitle?: string;
  /** How many days the lesson took to complete */
  lessonDuration?: number;
  lastEmotion?: string;
  daysAbsent?: number;
  businessName?: string;
  activeDaysThisWeek?: number;
  lessonsThisWeek?: number;
}

// --- Constants --------------------------------------------------------------

const MIRROR_SYSTEM_PROMPT =
  "You are generating a Mirror prompt for a student's Founder's Log. " +
  "RULES: ONE factual observation about what happened. ONE question that invites self-reflection. " +
  "Maximum 40 words total. NO advice, praise, reframing, encouragement, or suggestions. " +
  "You are a mirror, not a teacher. State what you see. Ask what they see.";

const MIRROR_MODEL = "claude-haiku-4-5-20251001";
const MIRROR_MAX_TOKENS = 100;
const MIRROR_TIMEOUT_MS = 5_000;

export const MIRROR_FALLBACK = "You're here. That's the first step. What's on your mind?";

// --- Banned-word lists for validation ---------------------------------------

const BANNED_ADVICE = ["should", "try", "remember", "consider", "think about"];
const BANNED_PRAISE = ["great", "amazing", "proud", "wonderful", "excellent", "good job"];
const BANNED_REFRAMING = ["failure is", "that's okay", "it's okay", "don't worry"];

// --- Validation -------------------------------------------------------------

/**
 * Returns `true` when the prompt passes all Mirror constraints:
 *  - 40 words or fewer
 *  - No banned advice, praise, or reframing phrases
 */
export function validateMirrorPrompt(prompt: string): boolean {
  const wordCount = prompt.trim().split(/\s+/).length;
  if (wordCount > 40) return false;

  const lower = prompt.toLowerCase();

  for (const word of BANNED_ADVICE) {
    if (lower.includes(word)) return false;
  }
  for (const word of BANNED_PRAISE) {
    if (lower.includes(word)) return false;
  }
  for (const phrase of BANNED_REFRAMING) {
    if (lower.includes(phrase)) return false;
  }

  return true;
}

// --- User-message assembly --------------------------------------------------

function assembleUserMessage(ctx: MirrorContext): string {
  const parts: string[] = [];

  switch (ctx.triggerType) {
    case "lesson_completion":
      if (ctx.lessonTitle) parts.push(`The student just completed the lesson "${ctx.lessonTitle}".`);
      if (ctx.lessonDuration != null) parts.push(`It took them ${ctx.lessonDuration} day(s).`);
      if (ctx.lastEmotion) parts.push(`Their last recorded emotion was "${ctx.lastEmotion}".`);
      if (ctx.businessName) parts.push(`Their business is called "${ctx.businessName}".`);
      break;

    case "return_from_absence":
      if (ctx.daysAbsent != null) parts.push(`The student returned after ${ctx.daysAbsent} days away.`);
      if (ctx.businessName) parts.push(`Their business is called "${ctx.businessName}".`);
      break;

    case "weekly_review":
      if (ctx.activeDaysThisWeek != null) parts.push(`The student was active ${ctx.activeDaysThisWeek} day(s) this week.`);
      if (ctx.lessonsThisWeek != null) parts.push(`They completed ${ctx.lessonsThisWeek} lesson(s) this week.`);
      if (ctx.businessName) parts.push(`Their business is called "${ctx.businessName}".`);
      break;
  }

  return parts.length > 0
    ? parts.join(" ")
    : "The student just interacted with the platform.";
}

// --- Generation -------------------------------------------------------------

/**
 * Generate a Mirror prompt via Claude Haiku. Falls back to
 * `MIRROR_FALLBACK` on timeout, validation failure, or any error.
 */
export async function generateMirrorPrompt(context: MirrorContext): Promise<string> {
  try {
    const response = await anthropic.messages.create(
      {
        model: MIRROR_MODEL,
        max_tokens: MIRROR_MAX_TOKENS,
        system: MIRROR_SYSTEM_PROMPT,
        messages: [{ role: "user", content: assembleUserMessage(context) }],
      },
      { timeout: MIRROR_TIMEOUT_MS },
    );

    const textBlock = response.content.find((block) => block.type === "text");
    const text = textBlock?.text?.trim() ?? "";

    if (!text || !validateMirrorPrompt(text)) {
      return MIRROR_FALLBACK;
    }

    return text;
  } catch {
    // Timeout, network failure, rate limit — always degrade gracefully
    return MIRROR_FALLBACK;
  }
}
