import "server-only";

/**
 * ML-based content moderation using Claude Haiku.
 *
 * This is the SECOND layer of moderation. The first layer is the regex
 * filter in content-moderation.ts (fast, cheap, blocks obvious stuff).
 * This ML layer catches what regex misses: subtle toxicity, coded language,
 * emerging slang, context-dependent threats.
 *
 * Used by lesson-chat and chat routes AFTER regex passes but BEFORE
 * the AI processes the message. Adds ~200ms latency but catches
 * what determined teenagers will try to evade.
 *
 * Falls back gracefully on API errors (returns safe:true) so it
 * never blocks legitimate students from learning.
 */

import { sendMessage } from "@/lib/ai";

export interface MLModerationResult {
  safe: boolean;
  category?: "harassment" | "hate" | "self-harm" | "sexual" | "violence" | "other";
  confidence?: "low" | "medium" | "high";
  reason?: string;
}

const SYSTEM_PROMPT = `You are a content safety classifier for a teen entrepreneurship education platform (ages 13-18).

Your job is to flag messages that contain:
- Harassment or bullying directed at specific people
- Hate speech (slurs, dehumanizing language)
- Self-harm content (NOT distress signals — those are handled separately)
- Sexual content (explicit descriptions, requests)
- Violence (threats, glorification, planning)
- Doxxing (sharing personal info)
- Drug dealing or illegal activity
- Coded language meant to evade filters

DO NOT flag:
- Normal frustration ("this is hard", "I'm stuck")
- Talking about difficult business topics (failure, money problems)
- Strong opinions or disagreement
- Casual slang
- Personal struggles being shared in good faith
- Discussion of products that happen to be edgy (alcohol, cannabis, vapes IF the student is exploring legal markets)

Respond with ONLY a JSON object:
{"safe": true} OR
{"safe": false, "category": "harassment|hate|self-harm|sexual|violence|other", "confidence": "low|medium|high", "reason": "brief explanation"}

Be conservative. Default to "safe": true if you're unsure. Only flag clear violations.`;

export async function moderateContentML(text: string): Promise<MLModerationResult> {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return { safe: true };
  }

  // Don't run ML on extremely short messages (probably not worth the cost)
  if (text.trim().length < 5) {
    return { safe: true };
  }

  try {
    const result = await sendMessage({
      feature: "moderation",
      systemPrompt: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Classify this message: "${text.slice(0, 1000)}"`,
        },
      ],
    });

    const cleanText = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Try to parse the JSON response
    try {
      const parsed = JSON.parse(cleanText);
      if (typeof parsed.safe === "boolean") {
        return parsed as MLModerationResult;
      }
    } catch {
      // Fallback: look for "safe" word in response
      if (cleanText.toLowerCase().includes('"safe": true')) return { safe: true };
      if (cleanText.toLowerCase().includes('"safe": false')) {
        return {
          safe: false,
          category: "other",
          confidence: "medium",
          reason: "Flagged by ML classifier",
        };
      }
    }

    // If we couldn't parse, default to safe (don't block legitimate students)
    return { safe: true };
  } catch (err) {
    console.error("[ml-moderation] failed:", err);
    // Network/API failure: don't block the student
    return { safe: true };
  }
}
