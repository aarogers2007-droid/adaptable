/**
 * Create invite code NETT01 for friends/family user testing on 2026-04-09.
 *
 * Linked to AJ's existing class. No expiration. Unlimited uses.
 * Idempotent — if NETT01 already exists, prints status and exits.
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

(async () => {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check if NETT01 already exists
  const { data: existing } = await sb
    .from("invite_codes")
    .select("id, code, class_id, expires_at, max_uses, current_uses, classes(name)")
    .eq("code", "NETT01")
    .maybeSingle();

  if (existing) {
    const cls = existing.classes as unknown as { name?: string } | null;
    console.log(`\nNETT01 already exists:`);
    console.log(`  class: "${cls?.name}"`);
    console.log(`  uses: ${existing.current_uses ?? 0}/${existing.max_uses ?? "∞"}`);
    console.log(`  expires: ${existing.expires_at ?? "never"}`);
    console.log(`\nReady to use at /join — just type 'NETT01' (or 'nett01').\n`);
    return;
  }

  // Find AJ's class to link the new code to. AJ is the only org_admin, and
  // there's exactly one class in the live DB ("Entrepreneurship 101") per
  // the verify-platform.ts run earlier.
  const { data: classes } = await sb
    .from("classes")
    .select("id, name, instructor_id")
    .order("created_at", { ascending: true });

  if (!classes || classes.length === 0) {
    console.error("No classes found in DB. Create a class first.");
    process.exit(1);
  }

  const targetClass = classes[0];
  console.log(`\nLinking NETT01 to class: "${targetClass.name}" (id: ${targetClass.id})\n`);

  // Insert the new invite code (created_by is not-null, use the class's instructor)
  const { data: inserted, error } = await sb
    .from("invite_codes")
    .insert({
      code: "NETT01",
      class_id: targetClass.id,
      created_by: targetClass.instructor_id,
      max_uses: null, // unlimited
      expires_at: null, // never
      current_uses: 0,
    })
    .select("id, code")
    .single();

  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }

  console.log(`✓ Created invite code NETT01 (id: ${inserted.id})`);
  console.log(`\nFriends and family can now go to /join and enter NETT01 (case-insensitive).`);
  console.log(`The join flow auto-uppercases input, so 'nett01' / 'Nett01' / 'NETT01' all work.\n`);
})();
