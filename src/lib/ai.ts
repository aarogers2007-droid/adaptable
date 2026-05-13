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
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

// ── Content block type for prompt caching ──

export interface CacheableTextBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}

/** System prompt: plain string (no caching) or content block array (with cache_control) */
export type SystemPromptInput = string | CacheableTextBlock[];

// ── Legacy Anthropic-only functions (for existing call sites) ──

interface SendMessageOptions {
  feature: AIFeature;
  systemPrompt: SystemPromptInput;
  messages: MessageInput[];
  /** Override model for per-lesson assignments. If set, uses this instead of MODEL_MAP[feature]. */
  modelOverride?: string;
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
      cache_creation_input_tokens: (response.usage as unknown as Record<string, number>).cache_creation_input_tokens,
      cache_read_input_tokens: (response.usage as unknown as Record<string, number>).cache_read_input_tokens,
    },
  };
}

/** Common stream interface for both Anthropic and OpenAI streaming */
export interface AIStream {
  [Symbol.asyncIterator](): AsyncIterator<{
    type: string;
    delta: { type: string; text: string };
  }>;
  finalMessage(): Promise<{
    content: { type: string; text: string }[];
    usage: { input_tokens: number; output_tokens: number };
  }>;
}

/**
 * Stream a message. Returns an async iterable of text chunks.
 * Routes to Anthropic or OpenAI based on model prefix.
 * Used by all chat Route Handlers.
 */
export async function streamMessage({ feature, systemPrompt, messages, modelOverride }: SendMessageOptions): Promise<AIStream> {
  const model = modelOverride ?? MODEL_MAP[feature];

  // Route to OpenAI streaming for gpt-* models
  if (model.startsWith("gpt-")) {
    return streamMessageOpenAI(model, systemPrompt, messages, MAX_TOKENS_MAP[feature]);
  }

  return anthropic.messages.stream({
    model,
    max_tokens: MAX_TOKENS_MAP[feature],
    system: systemPrompt,
    messages,
  }) as unknown as AIStream;
}

/**
 * OpenAI streaming wrapper that returns an async iterable matching
 * the Anthropic stream shape (content_block_delta events) so the
 * lesson-chat route handler works identically for both providers.
 *
 * Also exposes finalMessage() for usage extraction.
 */
async function streamMessageOpenAI(
  model: string,
  systemPrompt: SystemPromptInput,
  messages: MessageInput[],
  maxTokens: number,
) {
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI();

  const systemText = typeof systemPrompt === "string"
    ? systemPrompt
    : systemPrompt.map((b) => b.text).join("\n\n");

  const stream = await openai.chat.completions.create({
    model,
    max_tokens: maxTokens,
    stream: true,
    messages: [
      { role: "system", content: systemText },
      ...messages,
    ],
  });

  let fullText = "";
  let promptTokens = 0;
  let completionTokens = 0;

  // Create an async iterable that yields Anthropic-shaped events
  const events: Array<{ type: string; delta: { type: string; text: string } }> = [];
  const readers: Array<() => void> = [];
  let done = false;

  // Process in background
  const processing = (async () => {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullText += delta;
        const event = { type: "content_block_delta", delta: { type: "text_delta", text: delta } };
        events.push(event);
        for (const resolve of readers.splice(0)) resolve();
      }
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens ?? 0;
        completionTokens = chunk.usage.completion_tokens ?? 0;
      }
    }
    done = true;
    for (const resolve of readers.splice(0)) resolve();
  })();

  return {
    [Symbol.asyncIterator]() {
      let index = 0;
      return {
        async next() {
          while (index >= events.length && !done) {
            await new Promise<void>((resolve) => readers.push(resolve));
          }
          if (index < events.length) {
            return { value: events[index++], done: false as const };
          }
          return { value: undefined, done: true as const };
        },
      };
    },
    async finalMessage() {
      await processing;
      return {
        content: [{ type: "text" as const, text: fullText }],
        usage: {
          input_tokens: promptTokens,
          output_tokens: completionTokens,
        },
      };
    },
  };
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
