// ---------------------------------------------------------------------------
// Unit tests for src/lib/mirror.ts — validateMirrorPrompt
// ---------------------------------------------------------------------------

import { describe, it, expect, vi } from "vitest";

// mirror.ts imports "server-only" which throws outside a server component
// bundler. Stub it so the module can load in vitest.
vi.mock("server-only", () => ({}));

// Also stub the Anthropic SDK — we only test the pure validation function.
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: vi.fn() };
  },
}));

import { validateMirrorPrompt } from "@/lib/mirror";

describe("validateMirrorPrompt", () => {
  // ── Happy paths ───────────────────────────────────────────────────────

  it("accepts a valid prompt under 40 words with no banned words", () => {
    const prompt = "You completed a lesson in two days. What did you notice about your pace?";
    expect(validateMirrorPrompt(prompt)).toBe(true);
  });

  it("accepts an empty string (zero words is under 40)", () => {
    expect(validateMirrorPrompt("")).toBe(true);
  });

  it("accepts a prompt of exactly 40 words", () => {
    // Build a 40-word prompt from innocuous words
    const words = Array.from({ length: 40 }, (_, i) => `word${i}`);
    expect(validateMirrorPrompt(words.join(" "))).toBe(true);
  });

  // ── Word count rejection ──────────────────────────────────────────────

  it("rejects a prompt over 40 words", () => {
    const words = Array.from({ length: 41 }, (_, i) => `word${i}`);
    expect(validateMirrorPrompt(words.join(" "))).toBe(false);
  });

  // ── Banned advice words ───────────────────────────────────────────────

  it('rejects a prompt containing the advice word "should"', () => {
    expect(validateMirrorPrompt("You should reflect on that.")).toBe(false);
  });

  it('rejects a prompt containing the advice word "try"', () => {
    expect(validateMirrorPrompt("Why not try a different approach?")).toBe(false);
  });

  it('rejects a prompt containing "remember"', () => {
    expect(validateMirrorPrompt("Remember what you learned.")).toBe(false);
  });

  it('rejects a prompt containing "consider"', () => {
    expect(validateMirrorPrompt("Consider your next step.")).toBe(false);
  });

  it('rejects a prompt containing "think about"', () => {
    expect(validateMirrorPrompt("Think about what happened.")).toBe(false);
  });

  // ── Banned praise words ───────────────────────────────────────────────

  it('rejects a prompt containing the praise word "great"', () => {
    expect(validateMirrorPrompt("That was a great effort.")).toBe(false);
  });

  it('rejects a prompt containing "amazing"', () => {
    expect(validateMirrorPrompt("You did an amazing thing.")).toBe(false);
  });

  it('rejects a prompt containing "proud"', () => {
    expect(validateMirrorPrompt("You must be proud of that.")).toBe(false);
  });

  it('rejects a prompt containing "good job"', () => {
    expect(validateMirrorPrompt("Good job finishing the lesson.")).toBe(false);
  });

  // ── Banned reframing phrases ──────────────────────────────────────────

  it('rejects a prompt containing the reframing phrase "failure is"', () => {
    expect(validateMirrorPrompt("Failure is just learning.")).toBe(false);
  });

  it('rejects a prompt containing "that\'s okay"', () => {
    expect(validateMirrorPrompt("That's okay, everyone stumbles.")).toBe(false);
  });

  it('rejects a prompt containing "don\'t worry"', () => {
    expect(validateMirrorPrompt("Don't worry about it.")).toBe(false);
  });

  // ── Case insensitivity ────────────────────────────────────────────────

  it("detects banned words regardless of case", () => {
    expect(validateMirrorPrompt("You SHOULD reflect.")).toBe(false);
    expect(validateMirrorPrompt("GREAT work.")).toBe(false);
    expect(validateMirrorPrompt("FAILURE IS learning.")).toBe(false);
  });
});
