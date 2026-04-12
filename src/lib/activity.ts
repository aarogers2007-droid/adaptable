// ---------------------------------------------------------------------------
// Shared absence / activity-gap detection utilities
//
// Extracted from the "comeback" achievement logic in achievements.ts so that
// both the achievement engine and the Founder's Mirror can reuse the same
// gap-detection algorithm.
// ---------------------------------------------------------------------------

export interface AbsenceGap {
  /** Number of calendar days between the two usage-log entries */
  gapDays: number;
  /** Timestamp of the last activity before the gap */
  gapStart: Date;
  /** Timestamp of the first activity after the gap */
  gapEnd: Date;
}

/**
 * Scan an **ascending-chronological** array of usage-log entries and return
 * the first gap of `minDays` or more (default 5). Returns `null` if no such
 * gap exists or if fewer than two entries are provided.
 *
 * The logs are expected to already be sorted oldest-first (the default order
 * from Supabase when ordering by `created_at asc`).
 */
export function detectAbsenceGap(
  logs: { created_at: string }[],
  minDays = 5,
): AbsenceGap | null {
  if (logs.length < 2) return null;

  for (let i = 1; i < logs.length; i++) {
    const prev = new Date(logs[i - 1].created_at);
    const curr = new Date(logs[i].created_at);
    const gapDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (gapDays >= minDays) {
      return { gapDays, gapStart: prev, gapEnd: curr };
    }
  }

  return null;
}
