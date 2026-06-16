/**
 * Isolated moderation for the "AJ" founder AI on /assessment ONLY.
 *
 * WHY THIS FILE EXISTS (read before editing):
 * The AJ AI is the single chat on the platform allowed to use casual profanity,
 * because that is AJ's actual voice. Every other chat (lesson chat, /ask, etc.)
 * runs createStreamScrubber() from output-moderation.ts, which strips profanity.
 * To guarantee the profanity allowance can NEVER leak into a student-facing
 * surface, this module is fully self-contained: it does not import from, and is
 * not imported by, any shared moderation. Only /api/aj-chat imports it.
 *
 * The slur / hate / explicit / threat patterns below are duplicated ON PURPOSE
 * (snapshot of the platform blocklists, MINUS basic profanity). Duplication is
 * the safety property here: this page cannot accidentally relax the real filter,
 * and the real filter cannot accidentally relax this one. If you update the
 * platform slur lists, mirror the changes here too — but never delete from here.
 *
 * What this allows:   fuck, shit, damn, hell, ass, bitch, piss, crap, dick.
 * What this STILL blocks (output scrubbed to ***, input rejected):
 *   every racial / homophobic / antisemitic / ableist slur, explicit sexual
 *   content, violent threats, and prompt injection.
 */

// ── Cancellable content: slurs, hate, explicit, threats, illegal ──
// Basic profanity is intentionally absent.
const AJ_BLOCKED_PATTERNS: RegExp[] = [
  // English slurs and hate speech
  /\bn[i1]gg/i,
  /\bf[a@]gg/i,
  /\br[e3]t[a@]rd/i,
  /\bk[i1]ke\b/i,
  /\bsp[i1]c\b/i,
  /\bcunt\b/i,
  /\btr[a@]nn(y|ie)/i,
  /\bdyke\b/i,
  /\bchink\b/i,
  /\bw[e3]tback\b/i,
  /\bcoon\b/i,
  /\bgook\b/i,

  // Explicit sexual content
  /\bporn/i,
  /\bhentai\b/i,
  /\bsex\s*(with|slave|traffic)/i,
  /\borgas[m]/i,
  /\bgenital/i,
  /\berotic/i,
  /\bnude[s]?\b/i,

  // Graphic violence / threats
  /\bgore\b/i,
  /\bmutilat/i,
  /\btortur(e|ing)\b/i,
  /\bdismember/i,
  /\b(kill|murder|shoot|stab)\s+(people|everyone|them|him|her|kids|children)/i,
  /\bschool\s*shoot/i,
  /\bbomb\s*(threat|the|a|this)/i,

  // Drug dealing / illegal
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

  // ── Hindi (romanized) slurs ──
  /\bchamar\b/i,
  /\bbhangi\b/i,

  // ── Japanese (romanized) slurs ──
  /\bchon\b/i,
  /\bburakumin\b/i,

  // ── Korean (romanized) slurs ──
  /\bjjokbari\b/i,
  /\bttangkong\b/i,
];

// Prompt injection (snapshot of content-moderation INJECTION_PATTERNS).
const AJ_INJECTION_PATTERNS: RegExp[] = [
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
];

// Built with new RegExp + escaped strings so the SOURCE contains no invisible
// or confusable literal characters (keeps ESLint no-irregular-whitespace happy).
const ZERO_WIDTH = new RegExp(
  "[\\u200B\\u200C\\u200D\\u200E\\u200F\\uFEFF\\u00AD\\u034F\\u061C\\u2060\\u2061\\u2062\\u2063\\u2064\\u206A-\\u206F]",
  "g"
);
const COMBINING = new RegExp("[\\u0300-\\u036F]", "g");
const CONFUSABLES: Array<[RegExp, string]> = [
  [new RegExp("\\u0430", "g"), "a"], // Cyrillic a
  [new RegExp("[\\u0435\\u0451]", "g"), "e"], // Cyrillic e / yo
  [new RegExp("\\u043E", "g"), "o"], // Cyrillic o
  [new RegExp("\\u0440", "g"), "p"], // Cyrillic r
  [new RegExp("\\u0441", "g"), "c"], // Cyrillic s
  [new RegExp("\\u0445", "g"), "x"], // Cyrillic h
  [new RegExp("\\u0456", "g"), "i"], // Cyrillic i
];

/**
 * Normalize text to defeat common evasion (zero-width chars, confusables,
 * leetspeak, spacing). Snapshot of content-moderation's normalizer, trimmed.
 */
function normalize(text: string): string {
  let n = text.replace(ZERO_WIDTH, "");
  for (const [re, rep] of CONFUSABLES) n = n.replace(re, rep);
  n = n
    .replace(/[1!|]/g, "i")
    .replace(/[@]/g, "a")
    .replace(/[3]/g, "e")
    .replace(/[0]/g, "o")
    .replace(/[$5]/g, "s")
    .replace(/(\w)\s+(?=\w)/g, (m) => (m.length <= 3 ? m.replace(/\s+/g, "") : m));
  return n.normalize("NFKD").replace(COMBINING, "");
}

export interface AjModerationResult {
  safe: boolean;
  reason?: string;
}

/**
 * Moderate candidate INPUT to the AJ AI. Allows casual profanity; rejects
 * slurs / hate / explicit / threats and prompt injection.
 */
export function moderateAjInput(text: string): AjModerationResult {
  if (!text || typeof text !== "string") return { safe: true };
  const norm = normalize(text);

  for (const p of AJ_BLOCKED_PATTERNS) {
    if (p.test(text) || p.test(norm)) {
      return { safe: false, reason: "Let's keep it human. Ask me something real." };
    }
  }
  for (const p of AJ_INJECTION_PATTERNS) {
    if (p.test(text) || p.test(norm)) {
      return { safe: false, reason: "Nice try. Ask me something real." };
    }
  }
  return { safe: true };
}

/** Replace any blocked (slur/hate/explicit/threat) span with ***. Profanity is left intact. */
function scrubAjBlocked(text: string): string {
  if (!text || typeof text !== "string") return text;
  let cleaned = text;
  for (const p of AJ_BLOCKED_PATTERNS) {
    const g = new RegExp(p.source, p.flags.includes("g") ? p.flags : p.flags + "g");
    cleaned = cleaned.replace(g, "***");
  }
  return cleaned;
}

/**
 * Streaming scrubber for the AJ AI's OUTPUT. Mirrors createStreamScrubber's
 * word-boundary buffering, but scrubs ONLY slurs/hate/explicit/threats — basic
 * profanity flows through untouched. Self-contained; shares no state with the
 * platform scrubber.
 */
export function createAjStreamScrubber() {
  let buffer = "";
  let flushedUpTo = 0;

  return {
    push(chunk: string): string {
      buffer += chunk;
      const unflushed = buffer.slice(flushedUpTo);
      const boundaries = [" ", "\n", ".", ",", "!", "?"];
      let lastRelative = -1;
      for (const b of boundaries) {
        const idx = unflushed.lastIndexOf(b);
        if (idx > lastRelative) lastRelative = idx;
      }
      if (lastRelative < 0) return "";
      const absoluteIdx = flushedUpTo + lastRelative + 1;
      const toScrub = buffer.slice(flushedUpTo, absoluteIdx);
      const scrubbed = scrubAjBlocked(toScrub);
      flushedUpTo = absoluteIdx;
      return scrubbed;
    },
    flush(): string {
      const remaining = buffer.slice(flushedUpTo);
      flushedUpTo = buffer.length;
      return scrubAjBlocked(remaining);
    },
  };
}
