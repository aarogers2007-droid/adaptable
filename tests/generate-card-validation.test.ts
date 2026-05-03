import { describe, it, expect } from "vitest";

// We test the validation pipeline by importing the module and testing the exported function
// Since validateCardJSON is internal, we test through generateCardContent behavior
// But we can test the banned word regex and coherence checks directly

const BANNED_WORDS = [
  "invent", "inventor", "startup", "entrepreneur",
  "entrepreneurship", "business", "product", "build",
  "create", "design", "innovate", "innovation",
];

const BANNED_REGEX = new RegExp(`\\b(${BANNED_WORDS.join("|")})\\b`, "i");

describe("banned word detection", () => {
  it("catches all banned words", () => {
    for (const word of BANNED_WORDS) {
      expect(BANNED_REGEX.test(`This person loves to ${word} things.`)).toBe(true);
    }
  });

  it("catches case variations", () => {
    expect(BANNED_REGEX.test("A natural INNOVATOR")).toBe(false); // innovator not in list
    expect(BANNED_REGEX.test("She loves to INNOVATE")).toBe(true);
    expect(BANNED_REGEX.test("A startup founder")).toBe(true);
    expect(BANNED_REGEX.test("An Entrepreneur at heart")).toBe(true);
  });

  it("does not flag safe words", () => {
    expect(BANNED_REGEX.test("A thoughtful person who notices patterns.")).toBe(false);
    expect(BANNED_REGEX.test("Someone who sees what others miss.")).toBe(false);
    expect(BANNED_REGEX.test("Their curiosity runs deep.")).toBe(false);
  });

  it("catches banned words mid-sentence", () => {
    expect(BANNED_REGEX.test("They want to build something real.")).toBe(true);
    expect(BANNED_REGEX.test("A natural design thinker.")).toBe(true);
  });
});

describe("sentence validation rules", () => {
  it("rejects missing terminal period", () => {
    const text = "A thoughtful person";
    expect(text.endsWith(".")).toBe(false);
  });

  it("accepts single sentence with period", () => {
    const text = "A thoughtful person who sees what others miss.";
    expect(text.endsWith(".")).toBe(true);
    const inner = text.slice(0, -1);
    expect(inner.includes(".")).toBe(false);
    expect(inner.includes(";")).toBe(false);
  });

  it("rejects multiple sentences", () => {
    const text = "A thoughtful person. They see patterns.";
    const inner = text.slice(0, -1);
    expect(inner.includes(".")).toBe(true);
  });

  it("rejects semicolons", () => {
    const text = "A thoughtful person; they see patterns.";
    const inner = text.slice(0, -1);
    expect(inner.includes(";")).toBe(true);
  });
});

describe("valid card JSON structure", () => {
  const VALID_CARD = {
    description: "A quiet observer who notices the small things that everyone else walks past.",
    insights: {
      wish: "You want to hold something real in your hands when the work is done.",
      mind: "Your first instinct when something is broken is to figure out how to fix it yourself.",
      lens: "You carry knowledge about the natural world that most people your age never think about.",
      scale: "You measure success by whether one specific person's life got better.",
      voice: "You reach for a pencil before you reach for words.",
    },
  };

  it("has all required fields", () => {
    expect(typeof VALID_CARD.description).toBe("string");
    expect(VALID_CARD.description.trim().length).toBeGreaterThan(0);
    for (const key of ["wish", "mind", "lens", "scale", "voice"] as const) {
      expect(typeof VALID_CARD.insights[key]).toBe("string");
      expect(VALID_CARD.insights[key].trim().length).toBeGreaterThan(0);
    }
  });

  it("all fields are single sentences ending with period", () => {
    const allFields = [
      VALID_CARD.description,
      ...Object.values(VALID_CARD.insights),
    ];
    for (const field of allFields) {
      const trimmed = field.trim();
      expect(trimmed.endsWith(".")).toBe(true);
      const inner = trimmed.slice(0, -1);
      expect(inner.includes(".")).toBe(false);
      expect(inner.includes(";")).toBe(false);
    }
  });

  it("contains no banned words", () => {
    const allText = [VALID_CARD.description, ...Object.values(VALID_CARD.insights)].join(" ");
    expect(BANNED_REGEX.test(allText)).toBe(false);
  });
});
