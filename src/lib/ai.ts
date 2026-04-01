import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

/*
 * AI MODULE — all Claude API calls go through here.
 *
 *   ┌─────────────┐     ┌──────────────┐
 *   │ API Route /  │     │ Server       │
 *   │ Server Action│────▶│ ai.ts        │────▶ Claude API
 *   └─────────────┘     └──────────────┘
 *
 * Never call the Anthropic SDK directly from components or routes.
 * This module handles: context assembly, model selection, error handling,
 * usage logging, and rate limiting.
 */

export type AIFeature = "guide" | "ikigai" | "checkin" | "recommendations";

const MODEL_MAP: Record<AIFeature, string> = {
  guide: "claude-sonnet-4-20250514",
  ikigai: "claude-sonnet-4-20250514",
  checkin: "claude-haiku-4-5-20251001",
  recommendations: "claude-haiku-4-5-20251001",
};

const MAX_TOKENS_MAP: Record<AIFeature, number> = {
  guide: 1024,
  ikigai: 1024,
  checkin: 800,
  recommendations: 1200,
};

interface SendMessageOptions {
  feature: AIFeature;
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
  stream?: boolean;
}

/**
 * Send a message to Claude. Returns the full response text.
 * For streaming, use streamMessage instead.
 */
export async function sendMessage({
  feature,
  systemPrompt,
  messages,
}: Omit<SendMessageOptions, "stream">) {
  const response = await anthropic.messages.create({
    model: MODEL_MAP[feature],
    max_tokens: MAX_TOKENS_MAP[feature],
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return {
    text: textBlock?.text ?? "",
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  };
}

/**
 * Stream a message from Claude. Returns an async iterable of text chunks.
 * Used by the AI guide Route Handler.
 */
export async function streamMessage({
  feature,
  systemPrompt,
  messages,
}: Omit<SendMessageOptions, "stream">) {
  return anthropic.messages.stream({
    model: MODEL_MAP[feature],
    max_tokens: MAX_TOKENS_MAP[feature],
    system: systemPrompt,
    messages,
  });
}
