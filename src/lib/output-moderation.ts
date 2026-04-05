/**
 * Output moderation for AI-generated responses.
 *
 * Runs AFTER the full response is assembled (post-stream), before it's
 * shown to the student. Fast regex-based checks — no AI calls, <1ms.
 *
 * Catches things Claude's built-in filters might miss:
 * 1. Explicit content
 * 2. Age-inappropriate business advice for minors
 * 3. PII requests (asking students for personal info)
 * 4. Hallucinated URLs
 * 5. System prompt leakage
 */

export interface OutputModerationResult {
  safe: boolean;
  reason?: string;
  flagged_content?: string;
}

export const OUTPUT_FALLBACK_MESSAGE =
  "I got a little off track there. Let's get back to your business — what were we working on?";

// 1. Explicit content patterns
const EXPLICIT_PATTERNS = [
  /\bporn(ograph)?\b/i,
  /\bhentai\b/i,
  /\bsex(ual)?\s*(intercourse|act|position|slave|traffic)/i,
  /\borgas[m]/i,
  /\bgenital/i,
  /\berotic/i,
  /\bnude[s]?\b/i,
  /\bgore\b/i,
  /\bmutilat/i,
  /\btortur(e|ing)\b/i,
  /\bdismember/i,
  /\b(snort|inject|smoke|freebase)\s+(cocaine|heroin|meth|crack|fentanyl)/i,
  /\b(cook|make|brew)\s+(meth|crack|heroin)/i,
  /\bhow\s+to\s+(use|take|do)\s+(drugs|cocaine|heroin|meth|ecstasy|lsd)/i,
];

// 2. Age-inappropriate business advice for minors
const MINOR_INAPPROPRIATE_PATTERNS = [
  /\bsign\s+(a|the|this)\s+contract\b/i,
  /\bopen\s+(a|your)\s+bank\s+account\b(?!.*parent|.*guardian)/i,
  /\btake\s+out\s+(a|the)\s+loan\b/i,
  /\bapply\s+for\s+(a|the)\s+(credit\s+card|loan|mortgage)\b/i,
  /\b(bar|club|casino|gambling|liquor\s+store|dispensary|vape\s+shop)\s+(business|venture|idea)\b/i,
  /\b(sell|selling)\s+(alcohol|tobacco|cigarettes|vapes|firearms|guns|weapons)\b/i,
  /\bwork\s+(at|in)\s+(a\s+)?(bar|nightclub|casino|strip)/i,
];

// 2b. Profanity — AI should never swear at minors, even casually
// Covers: English, Spanish, French, Portuguese, German, Italian,
// Arabic (romanized), Hindi (romanized), Japanese (romanized), Korean (romanized)
const PROFANITY_PATTERNS = [
  // ── English ──
  /\bshit(ty|s)?\b/i,
  /\bbullshit\b/i,
  /\bfuck(ing|ed|er|s)?\b/i,
  /\bass(hole)?\b(?!ets|ign|ess|ist|ume|ert|ociat)/i,
  /\bbitch(es|ing)?\b/i,
  /\bdamn(ed|it)?\b/i,
  /\bhell\b(?!\s*(o|p))/i,
  /\bcrap(py)?\b/i,
  /\bwtf\b/i,
  /\bstfu\b/i,
  /\blmfao\b/i,
  /\bbadass\b/i,
  /\bpiss(ed|ing)?\b/i,
  /\bdick(head)?\b(?!ens|inson|son)/i,
  /\bcock\b(?!pit|tail|roach)/i,

  // ── Spanish ──
  /\bmierda\b/i,
  /\bput[ao]\b/i,
  /\bcabr[oó]n(a|es)?\b/i,
  /\bchinga(r|do|da)?\b/i,
  /\bpendej[oa]\b/i,
  /\bverga\b/i,
  /\bcoño\b/i,
  /\bjoder\b/i,
  /\bhij[oa]\s+de\s+put/i,
  /\bculo\b/i,
  /\bmaric[oó]n\b/i,
  /\bpinche\b/i,

  // ── French ──
  /\bmerde\b/i,
  /\bputain\b/i,
  /\bsal(aud|ope|opard)\b/i,
  /\benculé[es]?\b/i,
  /\bbordel\b/i,
  /\bnique\b/i,
  /\bta\s+gueule\b/i,
  /\bcon(nard|nasse)?\b(?!cept|cern|cert|duct|fid|firm|grat|nect|sent|sider|stit|sult|tact|tent|test|tin|trol|ven|vert|vinc)/i,
  /\bfoutre\b/i,
  /\bbâtard\b/i,

  // ── Portuguese ──
  /\bporra\b/i,
  /\bcaralho\b/i,
  /\bfoda(-se)?\b/i,
  /\bmerda\b/i,
  /\bfilh[oa]\s+da\s+put/i,
  /\bviad[oa]\b/i,
  /\bbuceta\b/i,
  /\bcuzão\b/i,
  /\barrombad[oa]\b/i,

  // ── German ──
  /\bscheiße\b/i,
  /\bscheisse\b/i,
  /\bfick(en|e|t|er)?\b/i,
  /\barsch(loch)?\b/i,
  /\bhure(nsohn)?\b/i,
  /\bwichser\b/i,
  /\bfotze\b/i,
  /\bmiststück\b/i,
  /\bverpiss\b/i,

  // ── Italian ──
  /\bcazzo\b/i,
  /\bstronz[oa]\b/i,
  /\bvaffanculo\b/i,
  /\bminchia\b/i,
  /\bfiga\b(?!ure|ment)/i,
  /\bputtana\b/i,
  /\bcoglione\b/i,
  /\bmerda\b/i,

  // ── Arabic (romanized) ──
  /\bsharmouta\b/i,
  /\bsharmoot[ah]?\b/i,
  /\bkuss?\s*ummak\b/i,
  /\bkuss?\s*umm[eio]k\b/i,
  /\bybn\s*(el)?kalb\b/i,
  /\bibn\s*(el)?sharmouta\b/i,
  /\bya\s+h(a|i)mar\b/i,
  /\bkhawal\b/i,
  /\bza[mn]i\b/i,
  /\btelhas\s+teezi\b/i,
  /\bayr(ak|ik|i)?\b/i,

  // ── Hindi (romanized) ──
  /\bchutiya\b/i,
  /\bbhosd[iy]ke?\b/i,
  /\bmadarchod\b/i,
  /\bbehenchod\b/i,
  /\bgaand\b/i,
  /\bharamkhor\b/i,
  /\brand[iy]\b/i,
  /\blund\b/i,
  /\bjhaat\b/i,
  /\bbc\b(?!c)/i, // common Hindi abbreviation, but only standalone

  // ── Japanese (romanized) ──
  /\bkuso\b/i,
  /\bshine\b(?!\s|d|s)/i, // "shine" = "die" in Japanese, careful with English word
  /\bbaka\b/i,
  /\byarou\b/i,
  /\bketsu\b/i,
  /\bkichiku\b/i,
  /\bmanko\b/i,
  /\bchinko\b/i,
  /\bkusobaba\b/i,

  // ── Korean (romanized) ──
  /\bssibal\b/i,
  /\bshipal\b/i,
  /\bbingshin\b/i,
  /\bjiral\b/i,
  /\bnom\b(?!inal|inate|enclat)/i,
  /\bsaekki\b/i,
  /\bgaesaekki\b/i,
  /\bkkeonjeo\b/i,
  /\bmichin\b/i,
];

// 3. PII request patterns (AI asking student for personal info)
const PII_REQUEST_PATTERNS = [
  /what('s| is)\s+your\s+(phone|cell|mobile)\s*(number|#)/i,
  /give\s+me\s+your\s+(phone|address|email|social)/i,
  /share\s+your\s+(phone|address|email|social\s+media|instagram|tiktok|snapchat)/i,
  /what('s| is)\s+your\s+(home\s+)?address/i,
  /send\s+me\s+your\s+(number|address|location)/i,
  /what('s| is)\s+your\s+(social\s+security|ssn|date\s+of\s+birth|birthday)/i,
  /where\s+do\s+you\s+live\b/i,
  /what\s+school\s+do\s+you\s+(go\s+to|attend)/i,
];

// 4. Hallucinated URLs
const URL_PATTERN = /https?:\/\/[^\s)>\]]+/i;

// 5. System prompt leakage
const PROMPT_LEAKAGE_PATTERNS = [
  /\[CHECKPOINT:/,
  /\[EMOTION:/,
  /\[STYLE:/,
  /\[PACE:/,
  /\[DETAIL:/,
  /\[MOTIVATION:/,
  /\[REGISTER:/,
  /\bSAFETY:\s*\n/,
  /\bRULES:\s*\n/,
  /\bCOMPLETION CRITERIA:/,
  /\bCHECKPOINT STATUS:/,
  /\bLEARNING STYLE ANALYSIS:/,
  /\bEMOTIONAL AWARENESS \(critical\):/,
  /\bREACTION-FIRST PATTERN/,
  /\bNEURODIVERGENT AWARENESS:/,
  /\bAI-CONTENT DETECTION:/,
  /\bLANGUAGE ADAPTATION \(critical\):/,
];

interface PatternCheck {
  patterns: RegExp[];
  reason: string;
}

const ALL_CHECKS: PatternCheck[] = [
  { patterns: EXPLICIT_PATTERNS, reason: "explicit_content" },
  { patterns: PROFANITY_PATTERNS, reason: "profanity" },
  { patterns: MINOR_INAPPROPRIATE_PATTERNS, reason: "age_inappropriate_advice" },
  { patterns: PII_REQUEST_PATTERNS, reason: "pii_request" },
  { patterns: [URL_PATTERN], reason: "hallucinated_url" },
  { patterns: PROMPT_LEAKAGE_PATTERNS, reason: "prompt_leakage" },
];

/**
 * Moderate AI output text. Returns safe:true or safe:false with reason.
 * Runs in <1ms — all regex, no AI calls.
 */
export function moderateOutput(text: string): OutputModerationResult {
  if (!text || typeof text !== "string") {
    return { safe: true };
  }

  for (const check of ALL_CHECKS) {
    for (const pattern of check.patterns) {
      const match = pattern.exec(text);
      if (match) {
        return {
          safe: false,
          reason: check.reason,
          flagged_content: match[0].slice(0, 100),
        };
      }
    }
  }

  return { safe: true };
}
