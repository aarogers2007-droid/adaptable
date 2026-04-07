/**
 * Crisis detection for student inputs.
 *
 * Detects signals of self-harm, suicidal ideation, abuse, or acute distress
 * in student messages. When detected:
 *   1. The teacher gets a HIGH severity alert immediately
 *   2. The AI's response is prefixed with a gentle "talk to someone" message
 *   3. The student sees crisis resources
 *
 * This is intentionally separate from content-moderation.ts because
 * the response is different: moderation BLOCKS, crisis detection
 * ESCALATES while continuing to support the student.
 *
 * Multilingual where possible, but English-first since most signals
 * are spoken naturally rather than translated.
 */

// Direct self-harm and suicidal ideation signals
const CRISIS_PATTERNS = [
  // ── Direct ideation ──
  /\b(want\s+to|wanna|going\s+to|gonna)\s+(die|kill\s+my(self)?|end\s+(it|my\s+life)|hurt\s+my(self)?)\b/i,
  /\b(kill|killing|end|ending)\s+my(self)?\b/i,
  /\b(suicid(e|al)|i'?m\s+suicidal)\b/i,
  /\bend\s+it\s+all\b/i,
  /\bnot\s+want\s+to\s+(be\s+here|live|exist)\b/i,
  /\bdon'?t\s+want\s+to\s+(be\s+here|live|exist|wake\s+up)\b/i,
  /\b(i\s+wish\s+i\s+(was|were)\s+dead)\b/i,
  /\b(i\s+(can'?t|cant)\s+(do\s+this|go\s+on|take\s+(it|this)))\b/i,
  /\bbetter\s+off\s+(dead|without\s+me)\b/i,
  /\b(no|nothing)\s+(point|reason)\s+(in|to)\s+(living|life|going\s+on)\b/i,
  /\b(no\s+one|nobody)\s+would\s+(care|miss\s+me|notice)\s+if\s+i\s+(was|were)\s+(gone|dead)\b/i,

  // ── Self-harm methods ──
  /\b(cutting|cut)\s+my(self)?\b/i,
  /\bself[-\s]?harm/i,
  /\bhurt(ing)?\s+my(self)?\b/i,
  /\b(slit|slitting)\s+my\s+(wrist|wrists)\b/i,
  /\boverdos(e|ing)\b/i,
  /\bjump\s+off\s+(a\s+)?(bridge|building|roof)\b/i,

  // ── Severe hopelessness ──
  /\bgive\s+up\s+on\s+(life|everything)\b/i,
  /\bi\s+(have\s+)?nothing\s+left\b/i,
  /\b(everyone|everything)\s+would\s+be\s+better\s+(off\s+)?without\s+me\b/i,
  /\bi\s+can'?t\s+stop\s+crying\b/i,
  /\b(i'?m|im)\s+(broken|empty|numb)\s+inside\b/i,

  // ── Abuse signals ──
  /\b(my\s+(dad|father|mom|mother|parent|step.?dad|step.?mom|uncle|aunt|brother|sister))\s+(hits|beats|hurts|abuses|touches)\s+me\b/i,
  /\b(being|getting)\s+(beaten|abused|hit|hurt)\s+(at\s+home|by)\b/i,
  /\b(scared|afraid)\s+to\s+go\s+home\b/i,

  // ── Spanish ──
  /\bquiero\s+morir(me)?\b/i,
  /\bme\s+quiero\s+matar\b/i,
  /\bsuicid(io|arme)\b/i,
];

export type CrisisSeverity = "critical" | "high" | "concerning";

export interface CrisisResult {
  detected: boolean;
  severity?: CrisisSeverity;
  matchedPattern?: string;
  type?: "ideation" | "self-harm" | "abuse" | "hopelessness";
}

/**
 * Scan a student message for crisis signals.
 * Returns immediately if no signals detected.
 */
export function detectCrisis(text: string): CrisisResult {
  if (!text || typeof text !== "string") {
    return { detected: false };
  }

  for (const pattern of CRISIS_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const matched = match[0].toLowerCase();
      // Categorize
      let type: CrisisResult["type"] = "hopelessness";
      let severity: CrisisSeverity = "concerning";

      if (/suicid|kill\s+my|end\s+my\s+life|wish.*dead|better\s+off\s+dead/.test(matched)) {
        type = "ideation";
        severity = "critical";
      } else if (/cut|self[-\s]?harm|hurt|overdos|jump\s+off|slit/.test(matched)) {
        type = "self-harm";
        severity = "critical";
      } else if (/dad|mom|parent|uncle|aunt|brother|sister|abused|beaten|scared\s+to\s+go\s+home/.test(matched)) {
        type = "abuse";
        severity = "high";
      } else {
        type = "hopelessness";
        severity = "high";
      }

      return {
        detected: true,
        severity,
        matchedPattern: matched.slice(0, 100),
        type,
      };
    }
  }

  return { detected: false };
}

/**
 * The supportive message to inject into the AI's response when crisis is detected.
 * Gentle, non-clinical, doesn't lecture. Tells the student they matter and
 * lists real resources.
 */
export function getCrisisResponse(studentName: string): string {
  return `${studentName}, I want to pause for a second. What you just said matters, and I want to make sure you have someone real to talk to — not just me.

Your teacher has been notified, and they care about you. Please also consider reaching out to one of these:

**988 Suicide & Crisis Lifeline** — call or text **988** (US, 24/7)
**Crisis Text Line** — text **HOME** to **741741** (US/Canada/UK/Ireland)
**Trevor Project** (LGBTQ+) — call **1-866-488-7386** or text **START** to **678-678**

You don't have to figure anything out alone. The people on these lines are there because they want to listen, with no judgment.

I'm still here when you're ready to keep going — whenever that is.`;
}
