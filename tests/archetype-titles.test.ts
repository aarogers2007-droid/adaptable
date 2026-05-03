import { describe, it, expect } from "vitest";
import { getArchetypeTitle, ARCHETYPES, SCALES, TITLE_MAP } from "@/lib/archetype-titles";

describe("archetype-titles", () => {
  // All 20 combinations must resolve
  const EXPECTED: [string, string, string][] = [
    ["builder", "one_person", "The Artisan"],
    ["builder", "community", "The Foundation"],
    ["builder", "generation", "The Blueprint"],
    ["builder", "world", "The Frontier"],
    ["empath", "one_person", "The Anchor"],
    ["empath", "community", "The Hearth"],
    ["empath", "generation", "The Lantern"],
    ["empath", "world", "The Pulse"],
    ["systems_thinker", "one_person", "The Decoder"],
    ["systems_thinker", "community", "The Lever"],
    ["systems_thinker", "generation", "The Framework"],
    ["systems_thinker", "world", "The Cartographer"],
    ["connector", "one_person", "The Gateway"],
    ["connector", "community", "The Weaver"],
    ["connector", "generation", "The Conductor"],
    ["connector", "world", "The Nexus"],
    ["storyteller", "one_person", "The Chronicle"],
    ["storyteller", "community", "The Herald"],
    ["storyteller", "generation", "The Myth"],
    ["storyteller", "world", "The Legend"],
  ];

  it("resolves all 20 combinations", () => {
    for (const [archetype, scale, expected] of EXPECTED) {
      expect(getArchetypeTitle(archetype, scale)).toBe(expected);
    }
  });

  it("covers exactly 20 combinations (5 archetypes × 4 scales)", () => {
    expect(ARCHETYPES.length).toBe(5);
    expect(SCALES.length).toBe(4);
    expect(Object.keys(TITLE_MAP).length).toBe(20);
  });

  it("normalizes whitespace and casing", () => {
    expect(getArchetypeTitle("  Builder  ", "  One_Person  ")).toBe("The Artisan");
    expect(getArchetypeTitle("SYSTEMS_THINKER", "WORLD")).toBe("The Cartographer");
    expect(getArchetypeTitle("Empath", "Community")).toBe("The Hearth");
  });

  it("normalizes spaces to underscores", () => {
    expect(getArchetypeTitle("systems thinker", "one person")).toBe("The Decoder");
  });

  it("throws on null archetype", () => {
    expect(() => getArchetypeTitle(null, "world")).toThrow("Missing input");
  });

  it("throws on null scale", () => {
    expect(() => getArchetypeTitle("builder", null)).toThrow("Missing input");
  });

  it("throws on unknown archetype with descriptive message", () => {
    expect(() => getArchetypeTitle("wizard", "world")).toThrow('Unknown archetype "wizard"');
  });

  it("throws on unknown scale with descriptive message", () => {
    expect(() => getArchetypeTitle("builder", "galaxy")).toThrow('Unknown scale "galaxy"');
  });

  it("throws on empty strings", () => {
    expect(() => getArchetypeTitle("", "world")).toThrow("Missing input");
    expect(() => getArchetypeTitle("builder", "")).toThrow("Missing input");
  });
});
