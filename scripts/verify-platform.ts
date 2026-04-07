/**
 * Pre-Cristal platform verification script.
 *
 * Checks the live DB for everything that could embarrass us in the demo:
 *   1. test02 invite code exists, valid, joinable
 *   2. All 22 lessons present (M1-M6, 4+4+3+4+3+4)
 *   3. knowledge_base has 25+ entries
 *   4. teacher_alerts table reachable
 *   5. classes table has voice_enabled column
 *   6. profiles table has consent fields
 *   7. New COPPA + deletion tables reachable
 *
 * Usage: npx tsx scripts/verify-platform.ts
 */

import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[t.slice(0, i).trim()] = v;
}

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PASS = "✓";
const FAIL = "✗";
const WARN = "⚠";
let failures = 0;
let warnings = 0;

function ok(label: string, detail = "") {
  console.log(`  ${PASS} ${label}${detail ? " — " + detail : ""}`);
}
function fail(label: string, detail = "") {
  console.log(`  ${FAIL} ${label}${detail ? " — " + detail : ""}`);
  failures++;
}
function warn(label: string, detail = "") {
  console.log(`  ${WARN} ${label}${detail ? " — " + detail : ""}`);
  warnings++;
}

(async () => {
  console.log("\n══════ ADAPTABLE PRE-CRISTAL PLATFORM VERIFICATION ══════\n");

  // ── 1. TEST02 invite code (codes are stored uppercase by convention) ──
  console.log("[1] Invite code 'TEST02' (case-insensitive — join flow auto-uppercases user input)");
  const { data: code, error: codeErr } = await sb
    .from("invite_codes")
    .select("id, code, class_id, expires_at, max_uses, current_uses, classes(id, name, instructor_id, voice_enabled, streaks_enabled)")
    .eq("code", "TEST02")
    .maybeSingle();

  if (codeErr) {
    fail("query failed", codeErr.message);
  } else if (!code) {
    fail("invite code 'test02' does not exist");
  } else {
    ok("invite code exists");
    const cls = code.classes as unknown as { id: string; name: string; instructor_id: string; voice_enabled: boolean; streaks_enabled: boolean } | null;
    if (cls) {
      ok(`linked class: "${cls.name}"`);
      ok(`voice_enabled = ${cls.voice_enabled}, streaks_enabled = ${cls.streaks_enabled}`);
    } else {
      fail("invite code exists but has no linked class");
    }

    if (code.expires_at) {
      const exp = new Date(code.expires_at);
      const now = new Date();
      if (exp < now) {
        fail(`code expired: ${exp.toISOString()}`);
      } else {
        ok(`expires: ${exp.toISOString()}`);
      }
    } else {
      ok("no expiration");
    }

    const used = (code.current_uses ?? 0) as number;
    const max = code.max_uses as number | null;
    if (max != null && used >= max) {
      fail(`exhausted: ${used}/${max} uses`);
    } else {
      ok(`uses: ${used}${max ? "/" + max : " (unlimited)"}`);
    }
  }
  console.log("");

  // ── 2. lessons ──
  console.log("[2] Lessons table");
  const { data: lessons, error: lessonsErr } = await sb
    .from("lessons")
    .select("module_sequence, lesson_sequence, module_name, title")
    .order("module_sequence")
    .order("lesson_sequence");
  if (lessonsErr) {
    fail("query failed", lessonsErr.message);
  } else if (!lessons || lessons.length === 0) {
    fail("no lessons found");
  } else {
    ok(`total lessons: ${lessons.length}`);
    const expected = [
      { mod: 1, count: 4 },
      { mod: 2, count: 4 },
      { mod: 3, count: 3 },
      { mod: 4, count: 4 },
      { mod: 5, count: 3 },
      { mod: 6, count: 4 },
    ];
    for (const e of expected) {
      const got = lessons.filter((l) => l.module_sequence === e.mod).length;
      if (got === e.count) {
        const modName = lessons.find((l) => l.module_sequence === e.mod)?.module_name ?? "?";
        ok(`Module ${e.mod} ("${modName}"): ${got}/${e.count} lessons`);
      } else {
        fail(`Module ${e.mod}: expected ${e.count}, got ${got}`);
      }
    }
    if (lessons.length !== 22) {
      warn(`expected exactly 22 lessons, got ${lessons.length}`);
    }
  }
  console.log("");

  // ── 3. knowledge_base ──
  console.log("[3] Knowledge base");
  const { count: kbCount, error: kbErr } = await sb
    .from("knowledge_base")
    .select("id", { count: "exact", head: true });
  if (kbErr) {
    fail("query failed", kbErr.message);
  } else {
    if ((kbCount ?? 0) >= 25) {
      ok(`entries: ${kbCount}`);
    } else {
      warn(`expected 25+ entries, got ${kbCount}`);
    }
  }
  console.log("");

  // ── 4. teacher_alerts ──
  console.log("[4] teacher_alerts table");
  const { error: alertsErr } = await sb
    .from("teacher_alerts")
    .select("id, alert_type, crisis_type, notification_failed", { head: true })
    .limit(1);
  if (alertsErr) {
    fail("query failed", alertsErr.message);
  } else {
    ok("table reachable");
    ok("crisis_type column present");
    ok("notification_failed column present");
  }
  console.log("");

  // ── 5. classes.voice_enabled ──
  console.log("[5] classes.voice_enabled column");
  const { error: voiceErr } = await sb
    .from("classes")
    .select("voice_enabled", { head: true })
    .limit(1);
  if (voiceErr) {
    fail("voice_enabled column missing", voiceErr.message);
  } else {
    ok("voice_enabled column present (migration 00019 applied)");
  }
  console.log("");

  // ── 6. profiles.date_of_birth + consent_status ──
  console.log("[6] profiles COPPA columns");
  const { error: dobErr } = await sb
    .from("profiles")
    .select("date_of_birth, consent_status, soft_deleted_at, deletion_scheduled_for", { head: true })
    .limit(1);
  if (dobErr) {
    fail("COPPA columns missing", dobErr.message);
  } else {
    ok("date_of_birth, consent_status, soft_deleted_at, deletion_scheduled_for all present (migrations 00020 + 00021 applied)");
  }
  console.log("");

  // ── 7. new tables ──
  console.log("[7] New tables (00018-00021)");
  const newTables = [
    "notification_failures",
    "deletion_requests",
    "data_access_log",
    "student_consent",
    "parental_consent_tokens",
  ];
  for (const t of newTables) {
    const { error } = await sb.from(t).select("id", { head: true }).limit(1);
    if (error) fail(`${t}`, error.message);
    else ok(`${t} reachable`);
  }
  console.log("");

  // ── 8. Production sanity: how many real classes/students exist ──
  console.log("[8] Production sanity check");
  const [{ count: classCount }, { count: studentCount }, { count: alertCount }] = await Promise.all([
    sb.from("classes").select("id", { count: "exact", head: true }),
    sb.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    sb.from("teacher_alerts").select("id", { count: "exact", head: true }),
  ]);
  ok(`classes: ${classCount}`);
  ok(`students: ${studentCount}`);
  ok(`teacher_alerts: ${alertCount}`);
  console.log("");

  // ── Summary ──
  console.log("══════════════════════════════════════════════════════════");
  if (failures === 0 && warnings === 0) {
    console.log(`  ${PASS} ALL CHECKS PASSED — platform is Cristal-ready`);
  } else {
    console.log(`  ${failures > 0 ? FAIL : PASS} ${failures} failures, ${warnings} warnings`);
  }
  console.log("══════════════════════════════════════════════════════════\n");

  process.exit(failures > 0 ? 1 : 0);
})().catch((e) => {
  console.error("Verification crashed:", e);
  process.exit(1);
});
