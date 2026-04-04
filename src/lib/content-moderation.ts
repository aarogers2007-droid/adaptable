/**
 * Content moderation for all user inputs.
 *
 * Applied to: name input, Ikigai custom entries, lesson messages,
 * skip-path business ideas. Runs BEFORE content reaches the AI
 * or gets stored in the database.
 *
 * Three layers:
 * 1. Hard block: profanity, slurs, explicit content
 * 2. Prompt injection detection: common injection patterns
 * 3. Name-specific: length limit, sanitization
 */

// Profanity/slur patterns (kept intentionally basic — not trying to be
// a comprehensive filter, just catching the obvious stuff that a student
// would try on day one)
const BLOCKED_PATTERNS = [
  // Slurs and hate speech (abbreviated patterns to catch variations)
  /\bn[i1]gg/i,
  /\bf[a@]gg/i,
  /\br[e3]t[a@]rd/i,
  /\bk[i1]ke\b/i,
  /\bsp[i1]c\b/i,
  /\bcunt\b/i,
  // Explicit sexual content
  /\bporn/i,
  /\bhentai\b/i,
  /\bsex\s*(with|slave|traffic)/i,
  // Violence/threats
  /\b(kill|murder|shoot|stab)\s+(people|everyone|them|him|her|kids|children)/i,
  /\bschool\s*shoot/i,
  /\bbomb\s*(threat|the|a|this)/i,
  // Drug dealing/illegal activity
  /\bsell(ing)?\s*(drugs|meth|cocaine|heroin|fentanyl)/i,
  /\bdrug\s*(deal|empire|cartel)/i,
];

// Prompt injection patterns
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?prior\s+instructions/i,
  /ignore\s+(your|the)\s+(system|initial)\s+prompt/i,
  /repeat\s+(everything|all|your)\s+(above|instructions|system\s*prompt)/i,
  /what\s+(are|is)\s+your\s+(system|initial)\s+(prompt|instructions)/i,
  /reveal\s+your\s+(system|initial)/i,
  /you\s+are\s+now\s+(a|an|my)/i,
  /from\s+now\s+on\s+(you|ignore|forget)/i,
  /disregard\s+(all|your|previous)/i,
  /override\s+(your|the|all)/i,
  /pretend\s+you\s+are/i,
  /act\s+as\s+(if|though)\s+you/i,
  /\]\s*\}\s*system/i, // JSON/code injection attempt
  /DROP\s+TABLE/i,
  /<script/i,
];

export interface ModerationResult {
  safe: boolean;
  reason?: string;
  type?: "profanity" | "injection" | "format";
}

/**
 * Moderate any text input. Returns safe:true or safe:false with reason.
 */
export function moderateContent(text: string): ModerationResult {
  if (!text || typeof text !== "string") {
    return { safe: true };
  }

  // Check blocked patterns (profanity, slurs, violence, illegal)
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        reason: "That content isn't appropriate here. Let's keep it focused on your venture.",
        type: "profanity",
      };
    }
  }

  // Check prompt injection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        reason: "I'm here to help you build your business. What are you working on?",
        type: "injection",
      };
    }
  }

  return { safe: true };
}

/**
 * Moderate a name specifically. Additional rules: length, no HTML.
 */
export function moderateName(name: string): ModerationResult {
  if (!name || typeof name !== "string") {
    return { safe: false, reason: "Please enter your name.", type: "format" };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { safe: false, reason: "Please enter your name.", type: "format" };
  }

  if (trimmed.length > 50) {
    return { safe: false, reason: "Name is too long. Keep it under 50 characters.", type: "format" };
  }

  if (trimmed.length < 2) {
    return { safe: false, reason: "Please enter at least 2 characters.", type: "format" };
  }

  // Strip HTML/script tags
  if (/<[^>]*>/.test(trimmed)) {
    return { safe: false, reason: "Please enter a regular name.", type: "format" };
  }

  // Check content moderation
  return moderateContent(trimmed);
}
