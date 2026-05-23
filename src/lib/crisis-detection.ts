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

import { getRegionalResources, formatCrisisResourcesForStudent } from "@/lib/crisis-resources";

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

// ── Universal two-layer detection ──

export interface UniversalCrisisResult {
  detected: boolean;
  severity?: CrisisSeverity;
  matchedPattern?: string;
  type?: "ideation" | "self-harm" | "abuse" | "hopelessness";
  detectedLanguage?: string;
  source: "regex" | "ml" | "both";
}

/**
 * Two-layer crisis detection. Runs regex first (instant), then ML in parallel.
 * If regex fires, returns immediately. ML result triggers alert async if regex missed.
 * Non-blocking — safe to call on every message.
 */
export async function detectCrisisUniversal(text: string): Promise<UniversalCrisisResult> {
  // Layer 1: regex fast pass
  const regexResult = detectCrisis(text);

  if (regexResult.detected) {
    // Regex fired — still kick off ML for language detection (non-blocking, don't await)
    import("@/lib/crisis-detection-ml").then(({ detectCrisisML }) =>
      detectCrisisML(text).catch(() => {})
    ).catch(() => {});

    return {
      ...regexResult,
      detectedLanguage: "English", // regex patterns are English/Spanish
      source: "regex",
    };
  }

  // Layer 2: ML universal detection (awaited since regex didn't fire)
  try {
    const { detectCrisisML } = await import("@/lib/crisis-detection-ml");
    const mlResult = await detectCrisisML(text);

    if (mlResult.crisis_detected && (mlResult.confidence === "high" || mlResult.confidence === "medium")) {
      return {
        detected: true,
        severity: mlResult.confidence === "high" ? "critical" : "high",
        type: mlResult.signal_type === "suicide" ? "ideation"
          : mlResult.signal_type === "self_harm" ? "self-harm"
          : mlResult.signal_type === "abuse" ? "abuse"
          : "hopelessness",
        detectedLanguage: mlResult.language,
        source: "ml",
      };
    }
  } catch {
    // ML failure — fail safe
  }

  return { detected: false, source: "regex" };
}

/**
 * Spanish version of the crisis response message.
 * Warm, direct, age-appropriate for a teenager.
 */
function getCrisisResponseSpanish(studentName: string, region?: string): string {
  const resources = getRegionalResources(region ?? "US");
  const resourceText = formatCrisisResourcesForStudent(resources);

  return `${studentName}, quiero pausar un momento. Lo que acabas de decir importa, y quiero asegurarme de que tengas a alguien real con quien hablar — no solo yo.

Alguien que se preocupa por ti ha sido notificado. También puedes comunicarte con:

${resourceText}

No tienes que resolver nada solo/sola. Las personas en estas líneas están ahí porque quieren escucharte, sin juzgar.

Aquí sigo cuando quieras continuar — sin prisa.`;
}

/**
 * The supportive message to inject into the AI's response when crisis is detected.
 * Uses regional crisis resources based on the org's configured region.
 * Supports language parameter for Spanish-speaking students.
 */
export function getCrisisResponse(studentName: string, region?: string, language?: string): string {
  if (language === "Spanish" || language === "es") {
    return getCrisisResponseSpanish(studentName, region);
  }

  const resources = getRegionalResources(region ?? "US");
  const resourceText = formatCrisisResourcesForStudent(resources);

  return `${studentName}, I want to pause for a second. What you just said matters, and I want to make sure you have someone real to talk to — not just me.

Someone who cares about you has been notified. Please also consider reaching out:

${resourceText}

You don't have to figure anything out alone. The people on these lines are there because they want to listen, with no judgment.

I'm still here when you're ready to keep going — whenever that is.`;
}
