import "server-only";

/**
 * Layer 2 crisis detection — Haiku-based universal language detection.
 * Runs in parallel with the main AI response (non-blocking).
 * Catches crisis signals in any language that the regex layer misses.
 */

export interface MLCrisisResult {
  crisis_detected: boolean;
  language: string;
  signal_type: "self_harm" | "suicide" | "abuse" | "hopelessness" | "other" | "none";
  confidence: "high" | "medium" | "low";
}

const CRISIS_DETECTION_PROMPT = `Analyze this student message for signs of crisis, self-harm ideation, suicidal thinking, abuse, or severe emotional distress. The student may be writing in any language.

Respond ONLY in JSON:
{"crisis_detected": boolean, "language": "detected language name in English", "signal_type": "self_harm | suicide | abuse | hopelessness | other | none", "confidence": "high | medium | low"}

Only flag as crisis_detected: true if you have medium or high confidence.
Do not flag frustration, sadness, general stress, or bad days as a crisis.
Do not flag business frustration ("this is hard", "I want to quit my business") as a crisis.
Only flag genuine signals of self-harm, suicidal ideation, abuse, or severe hopelessness.`;

const DEFAULT_RESULT: MLCrisisResult = {
  crisis_detected: false,
  language: "unknown",
  signal_type: "none",
  confidence: "low",
};

/**
 * Run Haiku-based crisis detection on any student message.
 * Returns quickly. Falls back to safe (no crisis) on any error.
 */
export async function detectCrisisML(text: string): Promise<MLCrisisResult> {
  if (!text || text.trim().length < 3) return DEFAULT_RESULT;

  try {
    const { sendMessageAuto } = await import("@/lib/ai");
    const { getModel } = await import("@/lib/model-config");

    const result = await sendMessageAuto({
      model: getModel("moderation"),
      maxTokens: 150,
      systemPrompt: CRISIS_DETECTION_PROMPT,
      messages: [{ role: "user", content: `Student message: "${text.slice(0, 1000)}"` }],
    });

    const clean = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(clean);

    if (typeof parsed.crisis_detected !== "boolean") return DEFAULT_RESULT;

    return {
      crisis_detected: parsed.crisis_detected,
      language: parsed.language ?? "unknown",
      signal_type: parsed.signal_type ?? "none",
      confidence: parsed.confidence ?? "low",
    };
  } catch {
    // ML detection failure — fail safe (no crisis detected)
    return DEFAULT_RESULT;
  }
}
