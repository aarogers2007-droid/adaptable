import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getProvider, MODELS } from "./model-config";

const anthropic = new Anthropic();

/*
 * AI MODULE — all AI calls go through here.
 *
 *   ┌─────────────┐     ┌──────────────┐
 *   │ API Route /  │     │ Server       │     ┌─── Anthropic API
 *   │ Server Action│────▶│ ai.ts        │────▶│
 *   └─────────────┘     └──────────────┘     └─── OpenAI API
 *
 * Never call the Anthropic or OpenAI SDK directly from components or routes.
 * Use sendMessageAuto() for new code — it routes to the correct SDK.
 * Use sendMessage() / streamMessage() for existing Anthropic-only paths.
 */

// ── Legacy types (deprecated — use model-config.ts instead) ──

export type AIFeature = "guide" | "ikigai" | "checkin" | "recommendations" | "pitch" | "moderation" | "card";

/**
 * @deprecated Use getModel() from model-config.ts instead.
 * Will be removed after all call sites are migrated.
 */
export const MODEL_MAP: Record<AIFeature, string> = {
  guide: "claude-sonnet-4-20250514",
  ikigai: "claude-sonnet-4-20250514",
  checkin: "claude-haiku-4-5-20251001",
  recommendations: "claude-haiku-4-5-20251001",
  pitch: "claude-sonnet-4-20250514",
  moderation: "claude-haiku-4-5-20251001",
  card: "claude-haiku-4-5-20251001",
};

const MAX_TOKENS_MAP: Record<AIFeature, number> = {
  guide: 1024,
  ikigai: 1024,
  checkin: 800,
  recommendations: 1200,
  pitch: 1024,
  moderation: 200,
  card: 1024,
};

// ── Shared types ──

interface MessageInput {
  role: "user" | "assistant";
  content: string;
}

interface AIResponse {
  text: string;
  model_used: string;
  usage: { input_tokens: number; output_tokens: number };
}

// ── Legacy Anthropic-only functions (for existing call sites) ──

interface SendMessageOptions {
  feature: AIFeature;
  systemPrompt: string;
  messages: MessageInput[];
}

/**
 * Send a message to Claude via the Anthropic SDK.
 * For new code, prefer sendMessageAuto().
 */
export async function sendMessage({ feature, systemPrompt, messages }: SendMessageOptions): Promise<AIResponse> {
  const model = MODEL_MAP[feature];
  const response = await anthropic.messages.create({
    model,
    max_tokens: MAX_TOKENS_MAP[feature],
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return {
    text: textBlock?.text ?? "",
    model_used: model,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  };
}

/**
 * Stream a message from Claude. Returns an async iterable of text chunks.
 * Used by the AI guide and lesson chat Route Handlers.
 */
export async function streamMessage({ feature, systemPrompt, messages }: SendMessageOptions) {
  return anthropic.messages.stream({
    model: MODEL_MAP[feature],
    max_tokens: MAX_TOKENS_MAP[feature],
    system: systemPrompt,
    messages,
  });
}

// ── New multi-provider functions ──

interface AutoMessageOptions {
  model: string;
  maxTokens: number;
  systemPrompt: string;
  messages: MessageInput[];
}

/**
 * Send a message to any supported AI provider.
 * Routes to Anthropic or OpenAI based on model string prefix.
 * On OpenAI failure: retries once, then falls back to Haiku.
 */
export async function sendMessageAuto(opts: AutoMessageOptions): Promise<AIResponse> {
  const provider = getProvider(opts.model);

  if (provider === "anthropic") {
    return sendMessageAnthropic(opts);
  }

  // OpenAI path with retry + Haiku fallback
  try {
    return await sendMessageOpenAI(opts);
  } catch (firstErr) {
    console.warn(`[ai] OpenAI first attempt failed (${opts.model}):`, firstErr instanceof Error ? firstErr.message : firstErr);

    // Retry once
    try {
      return await sendMessageOpenAI(opts);
    } catch (secondErr) {
      console.error(`[ai] OpenAI second attempt failed, falling back to Haiku:`, secondErr instanceof Error ? secondErr.message : secondErr);

      // Fallback to Haiku
      return sendMessageAnthropic({
        ...opts,
        model: MODELS.HAIKU,
      });
    }
  }
}

async function sendMessageAnthropic(opts: AutoMessageOptions): Promise<AIResponse> {
  const response = await anthropic.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens,
    system: opts.systemPrompt,
    messages: opts.messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return {
    text: textBlock?.text ?? "",
    model_used: opts.model,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  };
}

async function sendMessageOpenAI(opts: AutoMessageOptions): Promise<AIResponse> {
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI();

  const response = await openai.chat.completions.create({
    model: opts.model,
    max_tokens: opts.maxTokens,
    messages: [
      { role: "system", content: opts.systemPrompt },
      ...opts.messages,
    ],
  });

  const choice = response.choices[0];
  return {
    text: choice?.message?.content ?? "",
    model_used: opts.model,
    usage: {
      input_tokens: response.usage?.prompt_tokens ?? 0,
      output_tokens: response.usage?.completion_tokens ?? 0,
    },
  };
}
