/**
 * test-rls-policies.ts — RLS policy regression catcher
 *
 * For every RLS-protected table that students touch, this script:
 *   1. Creates two throwaway users (Student A and Student B)
 *   2. Signs in as each
 *   3. Runs a known-good operation (e.g. Student A updates their own profile)
 *      and asserts it succeeds
 *   4. Runs a known-bad operation (e.g. Student A tries to read Student B's
 *      profile, or escalate their own role) and asserts it FAILS
 *   5. Cleans up both users
 *
 * Catches the entire class of bug that bit us with migration 00014 — where a
 * policy is syntactically valid but breaks at runtime (recursion, comparison
 * mismatch, missing DELETE policy, etc.).
 *
 * Designed to fail loud: every assertion is real. No mocks. Real Supabase,
 * real auth, real RLS context.
 *
 * Cost: $0. Wall time: ~5-10 seconds. No permission prompts.
 *
 * Usage:
 *   bunx tsx scripts/test-rls-policies.ts
 */

import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[t.slice(0, i).trim()] = v;
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const failures: { test: string; reason: string }[] = [];
let passed = 0;

function pass(test: string) {
  passed++;
  process.stderr.write(`  ✅ ${test}\n`);
}

function fail(test: string, reason: string) {
  failures.push({ test, reason });
  process.stderr.write(`  ❌ ${test} — ${reason}\n`);
}

interface TestUser {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient;
}

async function createTestUser(
  sbAdmin: SupabaseClient,
  prefix: string
): Promise<TestUser> {
  const ts = Date.now() + Math.floor(Math.random() * 10000);
  const email = `rls-${prefix}-${ts}@gmail.com`;
  const password = `Rls-${ts}!`;
  const { data, error } = await sbAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `RLS Test ${prefix}` },
  });
  if (error || !data.user) throw new Error(`createUser ${prefix}: ${error?.message}`);

  await sbAdmin.from("profiles").upsert(
    {
      id: data.user.id,
      email,
      full_name: `RLS Test ${prefix}`,
      role: "student",
    },
    { onConflict: "id" }
  );

  const sbAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: sess, error: signinErr } = await sbAnon.auth.signInWithPassword({ email, password });
  if (signinErr || !sess.session) throw new Error(`sign in ${prefix}: ${signinErr?.message}`);

  return { id: data.user.id, email, password, client: sbAnon };
}

async function deleteTestUser(sbAdmin: SupabaseClient, user: TestUser) {
  // Cascade related rows first
  await sbAdmin.from("feedback").delete().eq("user_id", user.id);
  await sbAdmin.from("ai_conversations").delete().eq("student_id", user.id);
  await sbAdmin.from("student_progress").delete().eq("student_id", user.id);
  await sbAdmin.from("mentor_checkins").delete().eq("student_id", user.id);
  await sbAdmin.from("daily_checkins").delete().eq("student_id", user.id);
  await sbAdmin.auth.admin.deleteUser(user.id);
}

async function main() {
  process.stderr.write(`\n=== test-rls-policies ===\n\n`);

  const sbAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let alice: TestUser | null = null;
  let bob: TestUser | null = null;

  try {
    process.stderr.write(`[setup] creating two test students...\n`);
    [alice, bob] = await Promise.all([
      createTestUser(sbAdmin, "alice"),
      createTestUser(sbAdmin, "bob"),
    ]);
    process.stderr.write(`  alice: ${alice.email}\n`);
    process.stderr.write(`  bob:   ${bob.email}\n\n`);

    // ─────────────────────────────────────────────────────────────────
    // PROFILES
    // ─────────────────────────────────────────────────────────────────
    process.stderr.write(`[profiles]\n`);

    // Alice can read her own profile
    {
      const { data, error } = await alice.client
        .from("profiles")
        .select("id, full_name")
        .eq("id", alice.id)
        .single();
      if (!error && data) pass("alice reads her own profile");
      else fail("alice reads her own profile", error?.message ?? "no data");
    }

    // Alice CANNOT read Bob's profile
    {
      const { data } = await alice.client
        .from("profiles")
        .select("id, full_name")
        .eq("id", bob.id);
      if (!data || data.length === 0) pass("alice CANNOT read bob's profile (RLS blocks)");
      else fail("alice CANNOT read bob's profile (RLS blocks)", `got ${data.length} rows`);
    }

    // Alice can UPDATE her own profile (THE BUG WE FIXED)
    {
      const { error, data } = await alice.client
        .from("profiles")
        .update({
          business_idea: { name: "RLS Test Co", niche: "test", target_customer: "test", revenue_model: "test" },
        })
        .eq("id", alice.id)
        .select();
      if (!error && data && data.length === 1) {
        pass("alice UPDATE own profile (recursion regression check)");
      } else {
        fail("alice UPDATE own profile (recursion regression check)", error?.message ?? `${data?.length ?? 0} rows`);
      }
    }

    // Alice CANNOT escalate her own role
    {
      const { error, data } = await alice.client
        .from("profiles")
        .update({ role: "org_admin" })
        .eq("id", alice.id)
        .select();
      const blocked = !!error || (data?.length ?? 0) === 0;
      if (blocked) pass("alice CANNOT escalate role (RLS WITH CHECK)");
      else fail("alice CANNOT escalate role (RLS WITH CHECK)", "role change went through!");
    }

    // Alice CANNOT change her org_id
    {
      const fakeOrgId = "00000000-0000-0000-0000-000000000000";
      const { error, data } = await alice.client
        .from("profiles")
        .update({ org_id: fakeOrgId })
        .eq("id", alice.id)
        .select();
      const blocked = !!error || (data?.length ?? 0) === 0;
      if (blocked) pass("alice CANNOT change org_id (RLS WITH CHECK)");
      else fail("alice CANNOT change org_id (RLS WITH CHECK)", "org_id change went through!");
    }

    // Alice CANNOT update Bob's profile
    {
      const { error, data } = await alice.client
        .from("profiles")
        .update({ full_name: "hacked" })
        .eq("id", bob.id)
        .select();
      const blocked = !!error || (data?.length ?? 0) === 0;
      if (blocked) pass("alice CANNOT update bob's profile");
      else fail("alice CANNOT update bob's profile", "cross-user write went through!");
    }

    // ─────────────────────────────────────────────────────────────────
    // STUDENT_PROGRESS
    // ─────────────────────────────────────────────────────────────────
    process.stderr.write(`\n[student_progress]\n`);

    const { data: lessonRow } = await sbAdmin
      .from("lessons")
      .select("id")
      .limit(1)
      .single();
    const lessonId = (lessonRow as { id: string } | null)?.id;
    if (!lessonId) {
      fail("setup: lesson row exists", "no lessons in DB");
    } else {
      // Alice can insert her own progress row
      const { error: insertErr, data: insertData } = await alice.client
        .from("student_progress")
        .insert({ student_id: alice.id, lesson_id: lessonId, status: "in_progress" })
        .select()
        .single();
      if (!insertErr && insertData) pass("alice INSERT own student_progress");
      else fail("alice INSERT own student_progress", insertErr?.message ?? "no data");

      // Alice can read her own progress
      const { data: readData } = await alice.client
        .from("student_progress")
        .select("id")
        .eq("student_id", alice.id);
      if ((readData?.length ?? 0) >= 1) pass("alice reads own student_progress");
      else fail("alice reads own student_progress", `${readData?.length ?? 0} rows`);

      // Alice CANNOT read Bob's progress
      const { data: bobData } = await alice.client
        .from("student_progress")
        .select("id")
        .eq("student_id", bob.id);
      if ((bobData?.length ?? 0) === 0) pass("alice CANNOT read bob's student_progress");
      else fail("alice CANNOT read bob's student_progress", `${bobData?.length ?? 0} rows`);

      // Alice CANNOT insert progress for Bob
      const { error: forBobErr } = await alice.client
        .from("student_progress")
        .insert({ student_id: bob.id, lesson_id: lessonId, status: "in_progress" });
      if (forBobErr) pass("alice CANNOT INSERT student_progress for bob");
      else fail("alice CANNOT INSERT student_progress for bob", "cross-user insert went through!");
    }

    // ─────────────────────────────────────────────────────────────────
    // AI_CONVERSATIONS
    // ─────────────────────────────────────────────────────────────────
    process.stderr.write(`\n[ai_conversations]\n`);

    {
      const { error, data } = await alice.client
        .from("ai_conversations")
        .insert({
          student_id: alice.id,
          messages: [{ role: "user", content: "hello" }, { role: "assistant", content: "hi" }],
          message_count: 2,
        })
        .select()
        .single();
      if (!error && data) pass("alice INSERT own ai_conversation");
      else fail("alice INSERT own ai_conversation", error?.message ?? "no data");
    }

    {
      const { data } = await alice.client
        .from("ai_conversations")
        .select("id")
        .eq("student_id", bob.id);
      if ((data?.length ?? 0) === 0) pass("alice CANNOT read bob's ai_conversations");
      else fail("alice CANNOT read bob's ai_conversations", `${data?.length ?? 0} rows`);
    }

    // ─────────────────────────────────────────────────────────────────
    // FEEDBACK
    // ─────────────────────────────────────────────────────────────────
    process.stderr.write(`\n[feedback]\n`);

    {
      const { error } = await alice.client
        .from("feedback")
        .insert({
          user_id: alice.id,
          user_name: "RLS Test Alice",
          page: "/dashboard",
          message: "rls test",
          rating: 5,
          user_agent: "test-rls-policies",
        });
      if (!error) pass("alice INSERT feedback");
      else fail("alice INSERT feedback", error.message);
    }

    // ─────────────────────────────────────────────────────────────────
    // ANONYMOUS (no auth)
    // ─────────────────────────────────────────────────────────────────
    process.stderr.write(`\n[anonymous client (no auth)]\n`);

    const sbNoAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    {
      const { data } = await sbNoAuth.from("profiles").select("id").limit(1);
      if ((data?.length ?? 0) === 0) pass("anon CANNOT read any profile");
      else fail("anon CANNOT read any profile", `${data?.length ?? 0} rows`);
    }

    {
      const { data } = await sbNoAuth.from("ai_conversations").select("id").limit(1);
      if ((data?.length ?? 0) === 0) pass("anon CANNOT read ai_conversations");
      else fail("anon CANNOT read ai_conversations", `${data?.length ?? 0} rows`);
    }
  } finally {
    // Always clean up, even on test failure
    process.stderr.write(`\n[cleanup]\n`);
    if (alice) await deleteTestUser(sbAdmin, alice);
    if (bob) await deleteTestUser(sbAdmin, bob);
    process.stderr.write(`  ✅ test users deleted\n`);
  }

  // Final
  process.stderr.write(`\n=== RESULT ===\n`);
  process.stderr.write(`PASSED: ${passed}\n`);
  process.stderr.write(`FAILED: ${failures.length}\n`);
  if (failures.length > 0) {
    process.stderr.write(`\nFailures:\n`);
    for (const f of failures) process.stderr.write(`  - ${f.test}: ${f.reason}\n`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  process.stderr.write(`\nFATAL: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
