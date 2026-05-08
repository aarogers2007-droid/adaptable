/**
 * Centralized model configuration for all AI features.
 *
 * Every AI call reads its model from here via getModel().
 * Per-lesson overrides are handled by getLessonModel().
 * Provider routing (Anthropic vs OpenAI) is handled by getProvider().
 */

// ── Model strings (exact, verbatim) ──

export const MODELS = {
  MINI: "gpt-4o-mini-2024-07-18",
  HAIKU: "claude-haiku-4-5-20251001",
  SONNET: "claude-sonnet-4-20250514",
} as const;

// ── Feature type ──

export type ModelFeature =
  | "guide"           // AI Guide chat (LOCKED Sonnet)
  | "lesson_chat"     // Lesson conversations (LOCKED Sonnet)
  | "customer_interview" // Customer persona roleplay (Sonnet)
  | "ikigai_synthesis" // Business idea generation (Sonnet)
  | "ikigai_skip"     // Skip wizard synthesis (Sonnet)
  | "ikigai_suggestions" // Wizard suggestion chips (Haiku)
  | "exercise_feedback" // Lesson exercise evaluation (Haiku)
  | "pitch_feedback"  // Pitch evaluation (Haiku)
  | "card_generation" // Archetype card (Haiku, DO NOT TOUCH)
  | "kb_agent_1"      // Knowledge pipeline researcher (Sonnet, DO NOT TOUCH)
  | "kb_agent_2"      // Knowledge pipeline challenger (Mini)
  | "moderation"      // ML content moderation (Mini)
  | "mirror"          // Founder's Mirror prompt (Mini)
  | "checkin"         // Dashboard check-in (Mini)
  | "checkin_reply"   // Daily check-in response (Mini)
  | "recommendations" // Business resource recommendations (Mini)
  | "reengagement"    // Re-engagement teaser (Mini)
  | "support"         // Support chat (Mini);

// ── Default model assignments ──

const MODEL_CONFIG: Record<ModelFeature, string> = {
  // LOCKED — do not change
  guide: MODELS.SONNET,
  lesson_chat: MODELS.SONNET,

  // Sonnet — complex reasoning
  customer_interview: MODELS.SONNET,
  ikigai_synthesis: MODELS.SONNET,
  ikigai_skip: MODELS.SONNET,
  kb_agent_1: MODELS.SONNET,

  // Haiku — moderate complexity
  ikigai_suggestions: MODELS.HAIKU,
  exercise_feedback: MODELS.HAIKU,
  pitch_feedback: MODELS.HAIKU,
  card_generation: MODELS.HAIKU,

  // Mini — low complexity, validated output
  kb_agent_2: MODELS.MINI,
  moderation: MODELS.MINI,
  mirror: MODELS.MINI,
  checkin: MODELS.MINI,
  checkin_reply: MODELS.MINI,
  recommendations: MODELS.MINI,
  reengagement: MODELS.MINI,
  support: MODELS.MINI,
};

// ── Public API ──

/**
 * Get the model string for a feature.
 */
export function getModel(feature: ModelFeature): string {
  return MODEL_CONFIG[feature];
}

/**
 * Get the model for a specific lesson. Checks for a per-lesson override
 * in the database. Always returns a valid model string — never throws,
 * never returns empty.
 */
export async function getLessonModel(lessonId: string): Promise<string> {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("lessons")
      .select("model_override")
      .eq("id", lessonId)
      .single();

    if (data?.model_override && typeof data.model_override === "string") {
      return data.model_override;
    }
  } catch {
    // Database failure — fall back to default
  }

  return MODEL_CONFIG.lesson_chat;
}

/**
 * Determine which SDK to use based on model string prefix.
 */
export function getProvider(model: string): "anthropic" | "openai" {
  if (model.startsWith("gpt-")) return "openai";
  return "anthropic";
}
