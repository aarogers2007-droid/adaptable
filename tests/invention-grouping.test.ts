import { describe, it, expect, vi } from "vitest";

// invention-grouping.ts imports "server-only" which throws outside a server component
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import {
  getCohortMode,
  recommendGroupSize,
  getConstraintConfig,
  LARGE_COHORT_THRESHOLD,
  MEDIUM_COHORT_THRESHOLD,
} from "@/lib/invention-grouping";

describe("getCohortMode", () => {
  it("returns LARGE for 80+ students", () => {
    expect(getCohortMode(80)).toBe("LARGE");
    expect(getCohortMode(165)).toBe("LARGE");
    expect(getCohortMode(500)).toBe("LARGE");
  });

  it("returns MEDIUM for 30-79 students", () => {
    expect(getCohortMode(30)).toBe("MEDIUM");
    expect(getCohortMode(45)).toBe("MEDIUM");
    expect(getCohortMode(79)).toBe("MEDIUM");
  });

  it("returns SMALL for <30 students", () => {
    expect(getCohortMode(29)).toBe("SMALL");
    expect(getCohortMode(15)).toBe("SMALL");
    expect(getCohortMode(3)).toBe("SMALL");
    expect(getCohortMode(0)).toBe("SMALL");
  });

  it("boundary: 79 is MEDIUM, 80 is LARGE", () => {
    expect(getCohortMode(79)).toBe("MEDIUM");
    expect(getCohortMode(80)).toBe("LARGE");
  });

  it("boundary: 29 is SMALL, 30 is MEDIUM", () => {
    expect(getCohortMode(29)).toBe("SMALL");
    expect(getCohortMode(30)).toBe("MEDIUM");
  });

  it("thresholds match exported constants", () => {
    expect(LARGE_COHORT_THRESHOLD).toBe(80);
    expect(MEDIUM_COHORT_THRESHOLD).toBe(30);
  });
});

describe("recommendGroupSize", () => {
  describe("LARGE mode", () => {
    it("prefers 5 for 165 students", () => {
      const rec = recommendGroupSize(165, "LARGE");
      expect(rec.recommended).toBe(5);
      expect(rec.remainder).toBe(0); // 165 / 5 = 33 groups
      expect(rec.min).toBe(4);
      expect(rec.max).toBe(6);
    });

    it("picks size that minimizes remainder", () => {
      // 82 students: 82%4=2, 82%5=2, 82%6=4 → size 5 wins (larger on tie)
      const rec = recommendGroupSize(82, "LARGE");
      expect(rec.remainder).toBeLessThanOrEqual(2);
    });

    it("prefers larger size on equal remainder", () => {
      // 100: 100%4=0, 100%5=0, 100%6=4 → 5 wins (0 remainder, larger than 4)
      const rec = recommendGroupSize(100, "LARGE");
      expect(rec.recommended).toBe(5);
      expect(rec.remainder).toBe(0);
    });
  });

  describe("MEDIUM mode", () => {
    it("recommends 5 for 45 students (45%5=0)", () => {
      const rec = recommendGroupSize(45, "MEDIUM");
      expect(rec.recommended).toBe(5);
      expect(rec.remainder).toBe(0);
    });

    it("handles 31 students", () => {
      const rec = recommendGroupSize(31, "MEDIUM");
      expect(rec.remainder).toBeLessThanOrEqual(1);
      expect(rec.min).toBe(3);
      expect(rec.max).toBe(5);
    });
  });

  describe("SMALL mode", () => {
    it("recommends 3 or 4 for 12 students", () => {
      const rec = recommendGroupSize(12, "SMALL");
      expect([3, 4]).toContain(rec.recommended);
      expect(rec.remainder).toBe(0); // 12%3=0 and 12%4=0
    });

    it("handles 15 students", () => {
      const rec = recommendGroupSize(15, "SMALL");
      expect(rec.remainder).toBe(0); // 15%3=0
    });

    it("range is 3-4", () => {
      const rec = recommendGroupSize(10, "SMALL");
      expect(rec.min).toBe(3);
      expect(rec.max).toBe(4);
    });
  });

  it("handles 0 students", () => {
    const rec = recommendGroupSize(0, "SMALL");
    expect(rec.remainder).toBe(0);
  });
});

describe("getConstraintConfig", () => {
  it("LARGE mode uses category-first pooling with all hard constraints", () => {
    const config = getConstraintConfig("LARGE");
    expect(config.primarySort).toBe("category");
    expect(config.hardConstraints).toContain("archetype");
    expect(config.hardConstraints).toContain("ambition");
    expect(config.hardConstraints).toContain("category");
    expect(config.swapEnabled).toBe(true);
  });

  it("MEDIUM mode uses archetype-first pooling with relaxed category", () => {
    const config = getConstraintConfig("MEDIUM");
    expect(config.primarySort).toBe("archetype");
    expect(config.hardConstraints).toContain("archetype");
    expect(config.hardConstraints).toContain("ambition");
    expect(config.hardConstraints).not.toContain("category");
    expect(config.softConstraints).toContain("category");
    expect(config.swapEnabled).toBe(true);
  });

  it("SMALL mode uses archetype-first with only archetype hard, no swaps", () => {
    const config = getConstraintConfig("SMALL");
    expect(config.primarySort).toBe("archetype");
    expect(config.hardConstraints).toEqual(["archetype"]);
    expect(config.softConstraints).toContain("ambition");
    expect(config.softConstraints).toContain("category");
    expect(config.swapEnabled).toBe(false);
  });

  it("all modes have exactly 5 constraints total (hard + soft)", () => {
    for (const mode of ["LARGE", "MEDIUM", "SMALL"] as const) {
      const config = getConstraintConfig(mode);
      expect(config.hardConstraints.length + config.softConstraints.length).toBe(5);
    }
  });
});
