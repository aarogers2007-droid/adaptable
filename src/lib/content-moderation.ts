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
  // ── English profanity (blocked on input AND output) ──
  /\bshit(ty|s)?\b/i,
  /\bbullshit\b/i,
  /\bfuck(ing|ed|er|s)?\b/i,
  /\bass(hole)?\b(?!ets|ign|ess|ist|ume|ert|ociat)/i,
  /\bbitch(es|ing)?\b/i,
  /\bdamn(ed|it)?\b/i,
  /\bcrap(py)?\b/i,
  /\bdick(head)?\b(?!ens|inson|son)/i,
  /\bpiss(ed|ing)?\b/i,

  // ── English slurs and hate speech ──
  /\bn[i1]gg/i,
  /\bf[a@]gg/i,
  /\br[e3]t[a@]rd/i,
  /\bk[i1]ke\b/i,
  /\bsp[i1]c\b/i,
  /\bcunt\b/i,
  /\btr[a@]nn(y|ie)/i,
  /\bdyke\b/i,

  // ── Explicit sexual content ──
  /\bporn/i,
  /\bhentai\b/i,
  /\bsex\s*(with|slave|traffic)/i,

  // ── Violence/threats ──
  /\b(kill|murder|shoot|stab)\s+(people|everyone|them|him|her|kids|children)/i,
  /\bschool\s*shoot/i,
  /\bbomb\s*(threat|the|a|this)/i,

  // ── Drug dealing/illegal activity ──
  /\bsell(ing)?\s*(drugs|meth|cocaine|heroin|fentanyl)/i,
  /\bdrug\s*(deal|empire|cartel)/i,

  // ── Spanish slurs ──
  /\bmaric[oó]n\b/i,
  /\bjoto\b/i,
  /\bnegro\s+de\s+mierda/i,
  /\bsudaca\b/i,

  // ── French slurs ──
  /\bbougnoule\b/i,
  /\bnègre\b/i,
  /\bpédé\b/i,
  /\btapette\b/i,
  /\bgouine\b/i,

  // ── Portuguese slurs ──
  /\bviad[oa]\b/i,
  /\bpreto\s+de\s+merda/i,
  /\bbicha\b/i,
  /\bsapatão\b/i,

  // ── German slurs ──
  /\bkanake\b/i,
  /\bneger\b/i,
  /\bschwuchtel\b/i,
  /\btunte\b/i,
  /\bspasti\b/i,

  // ── Italian slurs ──
  /\bfrocio\b/i,
  /\bterrone\b/i,
  /\bnegro\s+di\s+merda/i,
  /\bricchione\b/i,

  // ── Arabic (romanized) slurs ──
  /\bsharmouta\b/i,
  /\bsharmoot[ah]?\b/i,
  /\bibn\s*(el)?sharmouta/i,
  /\bkhawal\b/i,
  /\bloot[iy]\b/i,
  /\babd\b(?!\s*(allah|el|al|ul))/i,

  // ── Hindi (romanized) slurs & severe profanity ──
  /\bchutiya\b/i,
  /\bbhosd[iy]ke?\b/i,
  /\bmadarchod\b/i,
  /\bbehenchod\b/i,
  /\bchamar\b/i,
  /\bbhangi\b/i,

  // ── Japanese (romanized) slurs ──
  /\bchon\b/i,
  /\bkichiku\b/i,
  /\bburakumin\b/i,
  /\bshikei\b/i,

  // ── Korean (romanized) slurs ──
  /\bjjokbari\b/i,
  /\bttangkong\b/i,
  /\bgaesaekki\b/i,
];

// Prompt injection patterns (English + multilingual)
const INJECTION_PATTERNS = [
  // English
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
  /\]\s*\}\s*system/i,
  /DROP\s+TABLE/i,
  /<script/i,
  // Spanish
  /ignora\s+(todas?\s+)?(las\s+)?instrucciones/i,
  /olvida\s+(todas?\s+)?(las\s+)?instrucciones/i,
  /ahora\s+eres\b/i,
  // French
  /ignore[zr]?\s+(toutes?\s+)?(les\s+)?instructions/i,
  /oublie[zr]?\s+(toutes?\s+)?(les\s+)?instructions/i,
  /tu\s+es\s+maintenant/i,
  // Portuguese
  /ignore\s+(todas?\s+)?instruções/i,
  /esqueça\s+(todas?\s+)?instruções/i,
  /agora\s+você\s+é/i,
  // German
  /ignoriere?\s+(alle\s+)?anweisungen/i,
  /vergiss\s+(alle\s+)?anweisungen/i,
  /du\s+bist\s+jetzt/i,
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
