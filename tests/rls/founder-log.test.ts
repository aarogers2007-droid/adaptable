// ---------------------------------------------------------------------------
// RLS integration tests for founder_log_entries
//
// These tests verify that the "Students own their reflections" RLS policy
// (from 00026_founders_mirror.sql) correctly isolates data per student.
//
// PREREQUISITE: A running Supabase instance with migrations applied.
//   - Local:  `supabase start` then `supabase db reset`
//   - CI:     spin up Supabase via the GitHub Action or Docker Compose
//
// The tests use two authenticated Supabase clients (one per student).
// Set these env vars (or populate .env.test):
//
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//   TEST_STUDENT_A_EMAIL / TEST_STUDENT_A_PASSWORD
//   TEST_STUDENT_B_EMAIL / TEST_STUDENT_B_PASSWORD
//
// If the env vars are missing the suite is skipped with a clear message.
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ── Env guard ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const STUDENT_A_EMAIL = process.env.TEST_STUDENT_A_EMAIL;
const STUDENT_A_PASSWORD = process.env.TEST_STUDENT_A_PASSWORD;
const STUDENT_B_EMAIL = process.env.TEST_STUDENT_B_EMAIL;
const STUDENT_B_PASSWORD = process.env.TEST_STUDENT_B_PASSWORD;

const canRun =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  STUDENT_A_EMAIL &&
  STUDENT_A_PASSWORD &&
  STUDENT_B_EMAIL &&
  STUDENT_B_PASSWORD;

describe.skipIf(!canRun)("founder_log_entries RLS", () => {
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let studentAId: string;
  let entryId: string;

  // ── Setup: authenticate both students ──────────────────────────────

  beforeAll(async () => {
    clientA = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    clientB = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    const { data: authA, error: errA } = await clientA.auth.signInWithPassword({
      email: STUDENT_A_EMAIL!,
      password: STUDENT_A_PASSWORD!,
    });
    if (errA) throw new Error(`Student A login failed: ${errA.message}`);
    studentAId = authA.user!.id;

    const { error: errB } = await clientB.auth.signInWithPassword({
      email: STUDENT_B_EMAIL!,
      password: STUDENT_B_PASSWORD!,
    });
    if (errB) throw new Error(`Student B login failed: ${errB.message}`);
  });

  // ── INSERT: student can create their own entry ─────────────────────

  it("Student A can INSERT their own founder_log_entries row", async () => {
    const { data, error } = await clientA
      .from("founder_log_entries")
      .insert({
        student_id: studentAId,
        trigger_type: "lesson_completion",
        mirror_prompt: "You finished lesson 1. What did you notice?",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.student_id).toBe(studentAId);
    entryId = data!.id;
  });

  // ── SELECT own: student can read their own entries ─────────────────

  it("Student A can SELECT their own entries", async () => {
    const { data, error } = await clientA
      .from("founder_log_entries")
      .select("*")
      .eq("id", entryId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data!.id).toBe(entryId);
  });

  // ── SELECT cross-user: another student cannot see the entry ────────

  it("Student B CANNOT SELECT Student A's entries", async () => {
    const { data, error } = await clientB
      .from("founder_log_entries")
      .select("*")
      .eq("id", entryId);

    // RLS filters the row out — no error, just an empty result set.
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  // ── UPDATE cross-user: another student cannot modify the entry ─────

  it("Student B CANNOT UPDATE Student A's entries", async () => {
    const { data, error } = await clientB
      .from("founder_log_entries")
      .update({ student_response: "hacked" })
      .eq("id", entryId)
      .select();

    // RLS prevents the update — either an error or zero rows affected.
    if (error) {
      // Some Supabase versions raise a permission error
      expect(error.code).toBeDefined();
    } else {
      // More commonly the update silently affects zero rows
      expect(data).toEqual([]);
    }
  });

  // ── Cleanup ────────────────────────────────────────────────────────

  // Remove test data so the suite is re-runnable.
  it("cleanup: Student A deletes the test entry", async () => {
    const { error } = await clientA
      .from("founder_log_entries")
      .delete()
      .eq("id", entryId);

    expect(error).toBeNull();
  });
});
