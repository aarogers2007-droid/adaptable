// ---------------------------------------------------------------------------
// Unit tests for src/lib/activity.ts — detectAbsenceGap
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { detectAbsenceGap } from "@/lib/activity";

/** Helper: build a log entry from a Date. */
function entry(date: Date) {
  return { created_at: date.toISOString() };
}

/** Helper: create a Date offset by `days` from a base date. */
function daysFrom(base: Date, days: number) {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

describe("detectAbsenceGap", () => {
  const base = new Date("2026-03-01T12:00:00Z");

  // ── Null cases ──────────────────────────────────────────────────────

  it("returns null for an empty array", () => {
    expect(detectAbsenceGap([])).toBeNull();
  });

  it("returns null for a single entry", () => {
    expect(detectAbsenceGap([entry(base)])).toBeNull();
  });

  it("returns null when no gap meets the default 5-day threshold", () => {
    const logs = [
      entry(base),
      entry(daysFrom(base, 3)), // 3 days apart — under threshold
    ];
    expect(detectAbsenceGap(logs)).toBeNull();
  });

  // ── Detected gaps ─────────────────────────────────────────────────

  it("detects a gap of exactly 5 days (default threshold)", () => {
    const logs = [
      entry(base),
      entry(daysFrom(base, 5)),
    ];
    const gap = detectAbsenceGap(logs);
    expect(gap).not.toBeNull();
    expect(gap!.gapDays).toBe(5);
    expect(gap!.gapStart).toEqual(base);
    expect(gap!.gapEnd).toEqual(daysFrom(base, 5));
  });

  it("reports the correct gapDays for a 7-day gap", () => {
    const logs = [
      entry(base),
      entry(daysFrom(base, 7)),
    ];
    const gap = detectAbsenceGap(logs);
    expect(gap).not.toBeNull();
    expect(gap!.gapDays).toBe(7);
  });

  it("finds the first qualifying gap in a multi-entry log", () => {
    const logs = [
      entry(base),
      entry(daysFrom(base, 1)),   // 1 day — no gap
      entry(daysFrom(base, 2)),   // 1 day — no gap
      entry(daysFrom(base, 8)),   // 6 days — gap!
      entry(daysFrom(base, 20)),  // 12 days — also a gap, but not first
    ];
    const gap = detectAbsenceGap(logs);
    expect(gap).not.toBeNull();
    expect(gap!.gapDays).toBe(6);
    expect(gap!.gapStart).toEqual(daysFrom(base, 2));
    expect(gap!.gapEnd).toEqual(daysFrom(base, 8));
  });

  // ── Custom minDays ────────────────────────────────────────────────

  it("respects a custom minDays parameter of 3", () => {
    const logs = [
      entry(base),
      entry(daysFrom(base, 3)),
    ];
    // Default threshold (5) would return null, but minDays=3 should detect it
    expect(detectAbsenceGap(logs, 5)).toBeNull();
    const gap = detectAbsenceGap(logs, 3);
    expect(gap).not.toBeNull();
    expect(gap!.gapDays).toBe(3);
  });

  it("respects a custom minDays parameter of 10", () => {
    const logs = [
      entry(base),
      entry(daysFrom(base, 7)),
    ];
    // 7-day gap, but minDays=10 means it's not enough
    expect(detectAbsenceGap(logs, 10)).toBeNull();
  });
});
