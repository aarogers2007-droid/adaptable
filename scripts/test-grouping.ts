/**
 * GROUPING ALGORITHM TEST SCRIPT
 *
 * Runs the grouping algorithm directly against Supabase using the service role key.
 * Bypasses all UI and auth checks.
 *
 * Usage: npx tsx scripts/test-grouping.ts
 */

import { readFileSync } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Load env
const envFile = readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
for (const line of envFile.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  let val = t.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
    val = val.slice(1, -1);
  process.env[t.slice(0, eq).trim()] = val;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CLASS_CODE = "VENTURE";

async function main() {
  console.log("=== GROUPING ALGORITHM TEST ===");
  console.log(`Class code: ${CLASS_CODE}`);
  console.log("");

  // Step 1: Check what data exists
  console.log("── Step 1: Checking existing data ──");

  const { data: allSessions, error: sessErr } = await supabase
    .from("invention_sessions")
    .select("student_id, circle_1_category, circle_2_archetype, circle_3_chips, circle_4_scale, circle_5_voice, completed_at, group_number")
    .eq("class_code", CLASS_CODE);

  if (sessErr) {
    console.error("Error querying invention_sessions:", sessErr);
    process.exit(1);
  }

  console.log(`Total invention_sessions rows for ${CLASS_CODE}: ${allSessions?.length ?? 0}`);

  if (!allSessions || allSessions.length === 0) {
    console.log("\nNo invention_sessions found for VENTURE. Creating test data...\n");
    await seedTestData();
    // Re-query
    const { data: requery } = await supabase
      .from("invention_sessions")
      .select("student_id, circle_1_category, circle_2_archetype, circle_3_chips, circle_4_scale, circle_5_voice, completed_at, group_number")
      .eq("class_code", CLASS_CODE);
    if (!requery?.length) {
      console.error("Failed to seed test data");
      process.exit(1);
    }
    console.log(`Seeded ${requery.length} test records`);
  }

  // Re-query for final state
  const { data: sessions } = await supabase
    .from("invention_sessions")
    .select("student_id, circle_1_category, circle_2_archetype, circle_3_chips, circle_4_scale, circle_5_voice, completed_at, group_number")
    .eq("class_code", CLASS_CODE);

  const completed = sessions?.filter(s => s.completed_at) ?? [];
  const incomplete = sessions?.filter(s => !s.completed_at) ?? [];

  console.log(`Completed: ${completed.length}`);
  console.log(`Incomplete: ${incomplete.length}`);
  console.log(`With group_number already set: ${sessions?.filter(s => s.group_number !== null).length}`);
  console.log("");

  if (completed.length === 0) {
    console.error("No completed sessions to group. Exiting.");
    process.exit(1);
  }

  // Step 2: Clear existing groups and reset group_numbers
  console.log("── Step 2: Clearing existing groups ──");
  await supabase.from("invention_groups").delete().eq("class_code", CLASS_CODE);
  await supabase.from("invention_sessions").update({ group_number: null }).eq("class_code", CLASS_CODE);
  console.log("Cleared existing groups and reset group_numbers");

  // Step 3: Run the algorithm (mirrors production code with Bug 1 fix)
  console.log("\n── Step 3: Running grouping algorithm ──");

  const students = completed.map(s => ({
    id: s.student_id,
    circle_1_category: s.circle_1_category ?? "wildcard",
    circle_2_archetype: s.circle_2_archetype ?? "builder",
    circle_3_chips: s.circle_3_chips ?? [],
    circle_4_scale: s.circle_4_scale ?? "community",
    circle_5_voice: s.circle_5_voice ?? [],
  }));

  const VISUAL_CHIPS = ["Draw it", "Build a prototype", "Build a slide or poster"];
  const VERBAL_CHIPS = ["Explain it out loud to someone", "Write it out"];
  const TARGET_ARCHETYPES = ["builder", "empath", "systems_thinker"];
  const GROUP_SIZE = 5;

  const pools = new Map<string, typeof students>();
  for (const s of students) {
    const pool = pools.get(s.circle_1_category) ?? [];
    pool.push(s);
    pools.set(s.circle_1_category, pool);
  }

  console.log("\nCategory pools:");
  for (const [cat, pool] of pools) {
    console.log(`  ${cat}: ${pool.length} students`);
  }

  interface GroupResult {
    group_number: number;
    student_ids: string[];
    composition: {
      category: string;
      archetypes: string[];
      missing_archetypes: string[];
      chip_diversity: number;
      scale_distribution: Record<string, number>;
      has_visual: boolean;
      has_verbal: boolean;
      all_criteria_met: boolean;
      compromises: string[];
    };
  }

  const allGroups: GroupResult[] = [];
  let groupCounter = 1;

  for (const [category, pool] of pools) {
    const remaining = [...pool];

    while (remaining.length > 0) {
      // BUG 1 FIX: merge small remainders into last group
      if (remaining.length < 3 && allGroups.length > 0) {
        const lastPoolGroup = [...allGroups].reverse().find(g => g.composition.category === category);
        if (lastPoolGroup) {
          for (const s of remaining) {
            lastPoolGroup.student_ids.push(s.id);
            lastPoolGroup.composition.archetypes.push(s.circle_2_archetype);
          }
          // Recompute composition
          const expanded = lastPoolGroup.student_ids.map(id => students.find(st => st.id === id)!).filter(Boolean);
          const missingNow = TARGET_ARCHETYPES.filter(a => !lastPoolGroup.composition.archetypes.includes(a));
          lastPoolGroup.composition.missing_archetypes = missingNow;
          const sDist: Record<string, number> = {};
          for (const s of expanded) sDist[s.circle_4_scale] = (sDist[s.circle_4_scale] ?? 0) + 1;
          lastPoolGroup.composition.scale_distribution = sDist;
          lastPoolGroup.composition.has_visual = expanded.some(s => s.circle_5_voice.some((v: string) => VISUAL_CHIPS.includes(v)));
          lastPoolGroup.composition.has_verbal = expanded.some(s => s.circle_5_voice.some((v: string) => VERBAL_CHIPS.includes(v)));
          const ac = expanded.flatMap(s => s.circle_3_chips);
          lastPoolGroup.composition.chip_diversity = ac.length > 0 ? Math.round((new Set(ac).size / ac.length) * 100) / 100 : 0;
          const scaleOk = Object.values(sDist).every(c => c <= 3);
          const comp: string[] = [];
          if (missingNow.length > 0) comp.push(`Missing archetypes: ${missingNow.join(", ")}`);
          if (!scaleOk) comp.push("Scale imbalance");
          if (!lastPoolGroup.composition.has_visual) comp.push("No visual communicator");
          if (!lastPoolGroup.composition.has_verbal) comp.push("No verbal communicator");
          lastPoolGroup.composition.compromises = comp;
          lastPoolGroup.composition.all_criteria_met = missingNow.length === 0 && scaleOk && lastPoolGroup.composition.has_visual && lastPoolGroup.composition.has_verbal;
          remaining.length = 0;
          continue;
        }
      }

      const group: typeof students = [];
      const targetSize = Math.min(GROUP_SIZE, remaining.length);

      for (const archetype of TARGET_ARCHETYPES) {
        if (group.length >= targetSize) break;
        const idx = remaining.findIndex(s => s.circle_2_archetype === archetype);
        if (idx !== -1) group.push(remaining.splice(idx, 1)[0]);
      }

      const usedArchetypes = new Set(group.map(s => s.circle_2_archetype));
      while (group.length < targetSize && remaining.length > 0) {
        const diverseIdx = remaining.findIndex(s => !usedArchetypes.has(s.circle_2_archetype));
        if (diverseIdx !== -1) {
          const s = remaining.splice(diverseIdx, 1)[0];
          usedArchetypes.add(s.circle_2_archetype);
          group.push(s);
        } else {
          group.push(remaining.shift()!);
        }
      }

      const allChips = group.flatMap(s => s.circle_3_chips);
      const uniqueChips = new Set(allChips);
      const chipDiversity = allChips.length > 0 ? uniqueChips.size / allChips.length : 0;
      const scaleDist: Record<string, number> = {};
      for (const s of group) scaleDist[s.circle_4_scale] = (scaleDist[s.circle_4_scale] ?? 0) + 1;
      const hasVisual = group.some(s => s.circle_5_voice.some((v: string) => VISUAL_CHIPS.includes(v)));
      const hasVerbal = group.some(s => s.circle_5_voice.some((v: string) => VERBAL_CHIPS.includes(v)));
      const archetypesInGroup = group.map(s => s.circle_2_archetype);
      const missingArchetypes = TARGET_ARCHETYPES.filter(a => !archetypesInGroup.includes(a));
      const scaleBalanced = Object.values(scaleDist).every(v => v <= 3);
      const compromises: string[] = [];
      if (missingArchetypes.length > 0) compromises.push(`Missing archetypes: ${missingArchetypes.join(", ")}`);
      if (!scaleBalanced) compromises.push("Scale imbalance");
      if (!hasVisual) compromises.push("No visual communicator");
      if (!hasVerbal) compromises.push("No verbal communicator");

      allGroups.push({
        group_number: groupCounter,
        student_ids: group.map(s => s.id),
        composition: {
          category,
          archetypes: archetypesInGroup,
          missing_archetypes: missingArchetypes,
          chip_diversity: Math.round(chipDiversity * 100) / 100,
          scale_distribution: scaleDist,
          has_visual: hasVisual,
          has_verbal: hasVerbal,
          all_criteria_met: missingArchetypes.length === 0 && scaleBalanced && hasVisual && hasVerbal,
          compromises,
        },
      });
      groupCounter++;
    }
  }

  // Voice swaps (correct swap logic — capture original before overwrite)
  for (const [, pool] of pools) {
    const catName = pool[0]?.circle_1_category;
    const poolGroupNums = allGroups.filter(g => g.composition.category === catName).map(g => g.group_number);
    if (poolGroupNums.length < 2) continue;
    const poolGroups = allGroups.filter(g => poolGroupNums.includes(g.group_number));

    for (const group of poolGroups) {
      if (group.composition.has_visual && group.composition.has_verbal) continue;
      const needsVisual = !group.composition.has_visual;
      const needsVerbal = !group.composition.has_verbal;

      for (const other of poolGroups) {
        if (other.group_number === group.group_number) continue;
        for (let i = 0; i < other.student_ids.length; i++) {
          const candidateId = other.student_ids[i];
          const candidate = students.find(s => s.id === candidateId);
          if (!candidate) continue;
          const cVis = candidate.circle_5_voice.some((v: string) => VISUAL_CHIPS.includes(v));
          const cVerb = candidate.circle_5_voice.some((v: string) => VERBAL_CHIPS.includes(v));
          if (needsVisual && !cVis) continue;
          if (needsVerbal && !cVerb) continue;

          const otherWithout = other.student_ids.filter(id => id !== candidateId);
          const otherStudents = otherWithout.map(id => students.find(s => s.id === id)!).filter(Boolean);
          if (needsVisual && cVis && !otherStudents.some(s => s.circle_5_voice.some((v: string) => VISUAL_CHIPS.includes(v)))) continue;
          if (needsVerbal && cVerb && !otherStudents.some(s => s.circle_5_voice.some((v: string) => VERBAL_CHIPS.includes(v)))) continue;

          for (let j = 0; j < group.student_ids.length; j++) {
            const originalId = group.student_ids[j]; // capture before overwrite
            group.student_ids[j] = candidateId;
            other.student_ids[i] = originalId;
            break;
          }
          if (needsVisual) group.composition.has_visual = true;
          if (needsVerbal) group.composition.has_verbal = true;
          group.composition.compromises = group.composition.compromises.filter(c => !c.includes("visual") && !c.includes("verbal"));
          group.composition.all_criteria_met = group.composition.missing_archetypes.length === 0 && group.composition.has_visual && group.composition.has_verbal;
          break;
        }
      }
    }
  }

  // Print full results
  console.log("\n── ALGORITHM RESULTS ──\n");
  console.log(`Total students processed: ${students.length}`);
  console.log(`Total groups created: ${allGroups.length}`);
  console.log(`Groups meeting all criteria: ${allGroups.filter(g => g.composition.all_criteria_met).length}`);
  console.log(`Groups with compromises: ${allGroups.filter(g => !g.composition.all_criteria_met).length}`);

  console.log("\n── PER-GROUP DETAIL ──");
  for (const g of allGroups) {
    console.log(`\nGroup ${g.group_number} (${g.composition.category}) — ${g.student_ids.length} students`);
    console.log(`  Archetypes: ${g.composition.archetypes.join(", ")}`);
    if (g.composition.missing_archetypes.length > 0) {
      console.log(`  ⚠ Missing: ${g.composition.missing_archetypes.join(", ")}`);
    }
    console.log(`  Chip diversity: ${Math.round(g.composition.chip_diversity * 100)}%`);
    console.log(`  Scale distribution: ${JSON.stringify(g.composition.scale_distribution)}`);
    console.log(`  Visual: ${g.composition.has_visual ? "✓" : "✗"}  Verbal: ${g.composition.has_verbal ? "✓" : "✗"}`);
    if (g.composition.compromises.length > 0) {
      console.log(`  Compromises: ${g.composition.compromises.join("; ")}`);
    } else {
      console.log(`  ✓ All criteria met`);
    }
  }

  // Step 4: Write results to database
  console.log("\n── Step 4: Writing results to database ──");

  // Clear existing groups
  const { error: delErr } = await supabase
    .from("invention_groups")
    .delete()
    .eq("class_code", CLASS_CODE);

  if (delErr) {
    console.error("Error clearing existing groups:", delErr);
  } else {
    console.log("Cleared existing groups");
  }

  // Insert new groups
  for (const g of allGroups) {
    const { error: insErr } = await supabase
      .from("invention_groups")
      .insert({
        class_code: CLASS_CODE,
        group_number: g.group_number,
        student_ids: g.student_ids,
        composition_log: g.composition,
      });

    if (insErr) {
      console.error(`Error inserting group ${g.group_number}:`, insErr);
    }
  }

  // Update group_number on each student
  for (const g of allGroups) {
    for (const sid of g.student_ids) {
      const { error: updErr } = await supabase
        .from("invention_sessions")
        .update({ group_number: g.group_number })
        .eq("student_id", sid)
        .eq("class_code", CLASS_CODE);

      if (updErr) {
        console.error(`Error updating group_number for ${sid}:`, updErr);
      }
    }
  }

  console.log(`Wrote ${allGroups.length} groups to invention_groups`);
  console.log(`Updated group_number for ${students.length} students`);

  // Step 5: Verify
  console.log("\n── Step 5: Verification ──");

  const { data: verifyRows } = await supabase
    .from("invention_sessions")
    .select("student_id, group_number, completed_at")
    .eq("class_code", CLASS_CODE);

  const withGroup = verifyRows?.filter(r => r.group_number !== null) ?? [];
  const withoutGroup = verifyRows?.filter(r => r.group_number === null) ?? [];
  const completedWithoutGroup = verifyRows?.filter(r => r.completed_at && r.group_number === null) ?? [];

  console.log(`Total rows: ${verifyRows?.length}`);
  console.log(`Rows with group_number: ${withGroup.length}`);
  console.log(`Rows without group_number: ${withoutGroup.length}`);
  console.log(`Completed rows WITHOUT group_number: ${completedWithoutGroup.length}`);

  if (completedWithoutGroup.length > 0) {
    console.log("⚠ BUG: Some completed students were not assigned a group!");
  } else {
    console.log("✓ All completed students have a group_number");
  }

  console.log("\n=== TEST COMPLETE ===");
}

const MOCK_NAMES = [
  "Aaliyah Torres", "Marcus Webb", "Priya Nair", "Jordan Reyes", "Destiny Banks",
  "Ethan Park", "Sofia Mendez", "Caleb Johnson", "Amara Osei", "Tyler Nguyen",
  "Zara Ahmed", "Devon Mitchell", "Isabella Cruz", "Noah Williams", "Maya Patel",
  "Liam Foster", "Nia Robinson", "Kai Thompson", "Aaliya Hassan", "Connor Walsh",
  "Leila Morales", "Aiden Scott", "Jasmine Lee", "Elijah Brown", "Fatima Ali",
  "Oscar Rivera", "Chloe Kim", "Isaiah Davis", "Luna Garcia", "Xavier James",
];

async function seedTestData() {
  const { data: inviteCode } = await supabase
    .from("invite_codes")
    .select("code, class_id")
    .eq("code", "VENTURE")
    .single();

  if (!inviteCode) {
    console.error("VENTURE invite code not found. Run migration 00032 first.");
    process.exit(1);
  }

  console.log(`VENTURE class_id: ${inviteCode.class_id}`);

  const mockStudents = [
    { category: "environmental", archetype: "empath", chips: ["animals and nature", "mental health"], scale: "world", voice: ["Draw it", "Explain it out loud to someone"] },
    { category: "digital", archetype: "builder", chips: ["technology and coding"], scale: "generation", voice: ["Build a prototype"] },
    { category: "medical", archetype: "systems_thinker", chips: ["medical condition or disability", "mental health"], scale: "community", voice: ["Write it out", "Build a slide or poster"] },
    { category: "environmental", archetype: "connector", chips: ["farming or food", "animals and nature"], scale: "world", voice: ["Explain it out loud to someone"] },
    { category: "social", archetype: "storyteller", chips: ["a specific culture or language"], scale: "one_person", voice: ["Act it out", "Build a slide or poster"] },
    { category: "digital", archetype: "empath", chips: ["technology and coding", "mental health"], scale: "community", voice: ["Write it out"] },
    { category: "medical", archetype: "builder", chips: ["medical condition or disability"], scale: "generation", voice: ["Build a prototype", "Draw it"] },
    { category: "environmental", archetype: "systems_thinker", chips: ["animals and nature"], scale: "world", voice: ["Explain it out loud to someone", "Write it out"] },
    { category: "social", archetype: "empath", chips: ["a specific culture or language", "religion or spiritual practice"], scale: "one_person", voice: ["Draw it"] },
    { category: "digital", archetype: "builder", chips: ["technology and coding"], scale: "generation", voice: ["Build a prototype"] },
    { category: "medical", archetype: "storyteller", chips: ["mental health", "medical condition or disability"], scale: "community", voice: ["Act it out", "Explain it out loud to someone"] },
    { category: "environmental", archetype: "connector", chips: ["farming or food"], scale: "world", voice: ["Build a slide or poster"] },
    { category: "social", archetype: "builder", chips: ["a specific culture or language"], scale: "generation", voice: ["Draw it", "Build a prototype"] },
    { category: "learning", archetype: "systems_thinker", chips: ["technology and coding", "sport or physical discipline"], scale: "community", voice: ["Write it out"] },
    { category: "medical", archetype: "empath", chips: ["medical condition or disability", "mental health"], scale: "one_person", voice: ["Explain it out loud to someone", "Draw it"] },
    { category: "digital", archetype: "connector", chips: ["technology and coding", "creative field"], scale: "generation", voice: ["Build a slide or poster", "Build a prototype"] },
    { category: "social", archetype: "storyteller", chips: ["a specific culture or language", "animals and nature"], scale: "one_person", voice: ["Act it out"] },
    { category: "learning", archetype: "builder", chips: ["technology and coding"], scale: "community", voice: ["Build a prototype", "Draw it"] },
    { category: "environmental", archetype: "empath", chips: ["animals and nature", "farming or food"], scale: "world", voice: ["Draw it"] },
    { category: "medical", archetype: "connector", chips: ["sport or physical discipline", "medical condition or disability"], scale: "generation", voice: ["Explain it out loud to someone", "Write it out"] },
    { category: "social", archetype: "systems_thinker", chips: ["a specific culture or language", "religion or spiritual practice"], scale: "community", voice: ["Build a slide or poster"] },
    { category: "learning", archetype: "empath", chips: ["mental health", "technology and coding"], scale: "one_person", voice: ["Explain it out loud to someone", "Draw it"] },
    { category: "digital", archetype: "storyteller", chips: ["creative field", "technology and coding"], scale: "generation", voice: ["Act it out", "Build a slide or poster"] },
    { category: "environmental", archetype: "builder", chips: ["farming or food", "animals and nature"], scale: "world", voice: ["Build a prototype"] },
    { category: "medical", archetype: "systems_thinker", chips: ["medical condition or disability", "mental health"], scale: "community", voice: ["Write it out", "Build a slide or poster"] },
    { category: "social", archetype: "connector", chips: ["a specific culture or language", "farming or food"], scale: "one_person", voice: ["Explain it out loud to someone"] },
    { category: "learning", archetype: "storyteller", chips: ["creative field", "sport or physical discipline"], scale: "generation", voice: ["Act it out", "Draw it"] },
    { category: "digital", archetype: "systems_thinker", chips: ["technology and coding"], scale: "community", voice: ["Write it out", "Explain it out loud to someone"] },
    { category: "learning", archetype: "connector", chips: ["creative field", "technology and coding"], scale: "generation", voice: ["Build a slide or poster", "Build a prototype"] },
    { category: "social", archetype: "builder", chips: ["sport or physical discipline"], scale: "world", voice: ["Build a prototype", "Draw it"] },
  ];

  console.log(`Creating ${mockStudents.length} test auth users + profiles + sessions...`);

  for (let i = 0; i < mockStudents.length; i++) {
    const s = mockStudents[i];
    const name = MOCK_NAMES[i];
    const email = `test${i + 1}@venturelab-test.local`;

    // Create auth user via admin API
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: "TestPass123!",
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (authErr) {
      // User might already exist from a previous run
      if (authErr.message?.includes("already been registered")) {
        // Find existing user
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existing = users?.find(u => u.email === email);
        if (existing) {
          // Upsert session with existing ID
          await supabase.from("invention_sessions").upsert({
            student_id: existing.id,
            class_code: CLASS_CODE,
            circle_1_category: s.category,
            idea_freetext: `Test idea: ${name}`,
            circle_2_archetype: s.archetype,
            circle_3_chips: s.chips,
            circle_3_freetext: `Test knowledge: ${name}`,
            circle_4_scale: s.scale,
            circle_5_voice: s.voice,
            completed_at: new Date().toISOString(),
          }, { onConflict: "student_id,class_code" });
          continue;
        }
      }
      console.error(`Error creating user ${name}:`, authErr.message);
      continue;
    }

    const userId = authUser.user.id;

    // Update profile name
    await supabase.from("profiles").update({ full_name: name }).eq("id", userId);

    // Create invention session
    const { error: sessErr } = await supabase.from("invention_sessions").upsert({
      student_id: userId,
      class_code: CLASS_CODE,
      circle_1_category: s.category,
      idea_freetext: `Test idea: ${name}`,
      circle_2_archetype: s.archetype,
      circle_3_chips: s.chips,
      circle_3_freetext: `Test knowledge: ${name}`,
      circle_4_scale: s.scale,
      circle_5_voice: s.voice,
      completed_at: new Date().toISOString(),
    }, { onConflict: "student_id,class_code" });

    if (sessErr) {
      console.error(`Error creating session for ${name}:`, sessErr.message);
    } else {
      console.log(`  ✓ ${name} (${email})`);
    }
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
