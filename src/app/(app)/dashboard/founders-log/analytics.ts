"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface MirrorAnalytics {
  totalEntries: number;
  totalResponded: number;
  totalSkipped: number;
  responseRate: number;
  avgResponseLength: number;
  medianTimeToRespondMs: number | null;
  avgTimeToRespondMs: number | null;
  byTriggerType: {
    trigger_type: string;
    count: number;
    responded: number;
    skip_rate: number;
  }[];
  byEmotion: {
    emotional_snapshot: string;
    count: number;
    responded: number;
  }[];
  dailyActivity: {
    date: string;
    entries: number;
    responded: number;
  }[];
  uniqueStudents: number;
  studentsWithMultiple: number;
}

/**
 * Aggregate Mirror analytics across all students (admin-only).
 * No student content is exposed. Only counts, rates, and timing.
 */
export async function getMirrorAnalytics(): Promise<MirrorAnalytics> {
  const admin = createAdminClient();

  // Fetch all entries (admin bypasses RLS)
  const { data: entries } = await admin
    .from("founder_log_entries")
    .select("student_id, trigger_type, student_response, emotional_snapshot, time_to_respond_ms, created_at")
    .order("created_at", { ascending: true });

  const all = entries ?? [];
  const responded = all.filter((e) => e.student_response != null);
  const skipped = all.filter((e) => e.student_response == null);

  // Response lengths
  const responseLengths = responded
    .map((e) => (e.student_response ?? "").length)
    .filter((l) => l > 0);
  const avgResponseLength = responseLengths.length > 0
    ? Math.round(responseLengths.reduce((a, b) => a + b, 0) / responseLengths.length)
    : 0;

  // Time to respond
  const times = responded
    .map((e) => e.time_to_respond_ms)
    .filter((t): t is number => t != null && t > 0)
    .sort((a, b) => a - b);
  const medianTimeToRespondMs = times.length > 0
    ? times[Math.floor(times.length / 2)]
    : null;
  const avgTimeToRespondMs = times.length > 0
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : null;

  // By trigger type
  const triggerMap = new Map<string, { count: number; responded: number }>();
  for (const e of all) {
    const t = triggerMap.get(e.trigger_type) ?? { count: 0, responded: 0 };
    t.count++;
    if (e.student_response != null) t.responded++;
    triggerMap.set(e.trigger_type, t);
  }
  const byTriggerType = [...triggerMap.entries()].map(([trigger_type, v]) => ({
    trigger_type,
    count: v.count,
    responded: v.responded,
    skip_rate: v.count > 0 ? Math.round((1 - v.responded / v.count) * 100) : 0,
  }));

  // By emotion
  const emotionMap = new Map<string, { count: number; responded: number }>();
  for (const e of all) {
    const emotion = e.emotional_snapshot ?? "unknown";
    const em = emotionMap.get(emotion) ?? { count: 0, responded: 0 };
    em.count++;
    if (e.student_response != null) em.responded++;
    emotionMap.set(emotion, em);
  }
  const byEmotion = [...emotionMap.entries()].map(([emotional_snapshot, v]) => ({
    emotional_snapshot,
    count: v.count,
    responded: v.responded,
  }));

  // Daily activity (last 30 days)
  const dailyMap = new Map<string, { entries: number; responded: number }>();
  for (const e of all) {
    const date = new Date(e.created_at).toISOString().slice(0, 10);
    const d = dailyMap.get(date) ?? { entries: 0, responded: 0 };
    d.entries++;
    if (e.student_response != null) d.responded++;
    dailyMap.set(date, d);
  }
  const dailyActivity = [...dailyMap.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  // Unique students
  const studentIds = new Set(all.map((e) => e.student_id));
  const studentsWithMultiple = [...new Map<string, number>()].length; // need to recount
  const studentCounts = new Map<string, number>();
  for (const e of all) {
    studentCounts.set(e.student_id, (studentCounts.get(e.student_id) ?? 0) + 1);
  }
  const multipleCount = [...studentCounts.values()].filter((c) => c >= 3).length;

  return {
    totalEntries: all.length,
    totalResponded: responded.length,
    totalSkipped: skipped.length,
    responseRate: all.length > 0 ? Math.round((responded.length / all.length) * 100) : 0,
    avgResponseLength,
    medianTimeToRespondMs,
    avgTimeToRespondMs,
    byTriggerType,
    byEmotion,
    dailyActivity,
    uniqueStudents: studentIds.size,
    studentsWithMultiple: multipleCount,
  };
}
