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
  const { data, error } = await sb
    .from("invite_codes")
    .select("id, code, class_id, expires_at, max_uses, current_uses, created_at, classes(name, voice_enabled, streaks_enabled)")
    .order("created_at", { ascending: false });
  if (error) { console.error(error); process.exit(1); }
  console.log(`Found ${data?.length ?? 0} invite codes:\n`);
  for (const row of data ?? []) {
    const cls = row.classes as unknown as { name?: string; voice_enabled?: boolean; streaks_enabled?: boolean } | null;
    const exp = row.expires_at ? new Date(row.expires_at) : null;
    const expired = exp && exp < new Date();
    const exhausted = row.max_uses != null && (row.current_uses ?? 0) >= row.max_uses;
    const status = expired ? "EXPIRED" : exhausted ? "EXHAUSTED" : "ACTIVE";
    console.log(`  code: "${row.code}"  class: "${cls?.name ?? '(no class)'}"  status: ${status}`);
    console.log(`    uses: ${row.current_uses ?? 0}/${row.max_uses ?? "∞"}  expires: ${exp ? exp.toISOString() : "never"}`);
    console.log(`    voice_enabled: ${cls?.voice_enabled}  streaks_enabled: ${cls?.streaks_enabled}`);
    console.log("");
  }
})();
