import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Invention Mode Grouping Algorithm
 *
 * Five-step sort:
 *   1. Primary: Circle 1 category (same category = same group pool)
 *   2. Secondary: Circle 2 archetype (aim for Builder + Empath + Systems Thinker minimum)
 *   3. Tertiary: Circle 3 chips (maximize diversity within groups)
 *   4. Balance: Circle 4 scale (no more than 3 of same scale per group)
 *   5. Role mapping: Circle 5 voice (visual + verbal coverage)
 */

interface Student {
  id: string;
  circle_1_category: string;
  circle_2_archetype: string;
  circle_3_chips: string[];
  circle_4_scale: string;
  circle_5_voice: string[];
}

interface GroupResult {
  group_number: number;
  student_ids: string[];
  composition: {
    category: string;
    archetypes: string[];
    missing_archetypes: string[];
    chip_diversity: number; // unique chips / total chips
    scale_distribution: Record<string, number>;
    has_visual: boolean;
    has_verbal: boolean;
    all_criteria_met: boolean;
    compromises: string[];
  };
}

interface AlgorithmLog {
  ran_at: string;
  total_students: number;
  total_groups: number;
  groups_meeting_all_criteria: number;
  groups_with_compromises: number;
  details: GroupResult[];
}

const VISUAL_CHIPS = ["Draw it", "Build a prototype", "Build a slide or poster"];
const VERBAL_CHIPS = ["Explain it out loud to someone", "Write it out"];
const TARGET_ARCHETYPES = ["builder", "empath", "systems_thinker"];

/**
 * Run the grouping algorithm for a class code.
 * Returns the algorithm log with group assignments.
 */
export async function runGroupingAlgorithm(
  classCode: string,
  groupSize: number = 5
): Promise<{ log: AlgorithmLog; error?: string }> {
  const supabase = await createClient();

  // Fetch all completed invention sessions for this class code
  const { data: sessions, error } = await supabase
    .from("invention_sessions")
    .select("student_id, circle_1_category, circle_2_archetype, circle_3_chips, circle_4_scale, circle_5_voice")
    .eq("class_code", classCode)
    .not("completed_at", "is", null);

  if (error || !sessions?.length) {
    return {
      log: { ran_at: new Date().toISOString(), total_students: 0, total_groups: 0, groups_meeting_all_criteria: 0, groups_with_compromises: 0, details: [] },
      error: error?.message ?? "No completed sessions found",
    };
  }

  const students: Student[] = sessions.map((s) => ({
    id: s.student_id,
    circle_1_category: s.circle_1_category ?? "wildcard",
    circle_2_archetype: s.circle_2_archetype ?? "builder",
    circle_3_chips: s.circle_3_chips ?? [],
    circle_4_scale: s.circle_4_scale ?? "community",
    circle_5_voice: s.circle_5_voice ?? [],
  }));

  // ── Step 1: Primary sort on Circle 1 (category pools) ──
  const pools = new Map<string, Student[]>();
  for (const s of students) {
    const pool = pools.get(s.circle_1_category) ?? [];
    pool.push(s);
    pools.set(s.circle_1_category, pool);
  }

  // ── Step 2-5: Form groups within each pool ──
  const allGroups: GroupResult[] = [];
  let groupCounter = 1;

  for (const [category, pool] of pools) {
    const remaining = [...pool];

    while (remaining.length > 0) {
      // If fewer than 3 students remain, merge them into the last group
      // in this pool rather than creating a tiny group
      if (remaining.length < 3 && allGroups.length > 0) {
        const lastPoolGroup = [...allGroups].reverse().find(
          (g) => g.composition.category === category
        );
        if (lastPoolGroup) {
          for (const s of remaining) {
            lastPoolGroup.student_ids.push(s.id);
            lastPoolGroup.composition.archetypes.push(s.circle_2_archetype);
          }
          // Recompute composition for the expanded group
          const expandedStudents = lastPoolGroup.student_ids.map(
            (id) => students.find((st) => st.id === id)!
          ).filter(Boolean);
          const missingNow = TARGET_ARCHETYPES.filter(
            (a) => !lastPoolGroup.composition.archetypes.includes(a)
          );
          lastPoolGroup.composition.missing_archetypes = missingNow;
          const expandedScaleDist: Record<string, number> = {};
          for (const s of expandedStudents) {
            expandedScaleDist[s.circle_4_scale] = (expandedScaleDist[s.circle_4_scale] ?? 0) + 1;
          }
          lastPoolGroup.composition.scale_distribution = expandedScaleDist;
          lastPoolGroup.composition.has_visual = expandedStudents.some((s) =>
            s.circle_5_voice.some((v) => VISUAL_CHIPS.includes(v))
          );
          lastPoolGroup.composition.has_verbal = expandedStudents.some((s) =>
            s.circle_5_voice.some((v) => VERBAL_CHIPS.includes(v))
          );
          const allChipsExpanded = expandedStudents.flatMap((s) => s.circle_3_chips);
          const uniqueExpanded = new Set(allChipsExpanded);
          lastPoolGroup.composition.chip_diversity = allChipsExpanded.length > 0
            ? Math.round((uniqueExpanded.size / allChipsExpanded.length) * 100) / 100
            : 0;
          const scaleOk = Object.values(expandedScaleDist).every((c) => c <= 3);
          const compromisesNow: string[] = [];
          if (missingNow.length > 0) compromisesNow.push(`Missing archetypes: ${missingNow.join(", ")}`);
          if (!scaleOk) compromisesNow.push("Scale imbalance: >3 students selected same scale option");
          if (!lastPoolGroup.composition.has_visual) compromisesNow.push("No visual communicator (draw/prototype/poster)");
          if (!lastPoolGroup.composition.has_verbal) compromisesNow.push("No verbal communicator (explain out loud/write)");
          lastPoolGroup.composition.compromises = compromisesNow;
          lastPoolGroup.composition.all_criteria_met =
            missingNow.length === 0 && scaleOk && lastPoolGroup.composition.has_visual && lastPoolGroup.composition.has_verbal;

          remaining.length = 0;
          continue;
        }
      }

      const group: Student[] = [];
      const targetSize = Math.min(groupSize, remaining.length);

      // Step 2: Pick one of each target archetype first
      for (const archetype of TARGET_ARCHETYPES) {
        if (group.length >= targetSize) break;
        const idx = remaining.findIndex((s) => s.circle_2_archetype === archetype);
        if (idx !== -1) {
          group.push(remaining.splice(idx, 1)[0]);
        }
      }

      // Fill remaining slots — prioritize archetype diversity
      const usedArchetypes = new Set(group.map((s) => s.circle_2_archetype));
      while (group.length < targetSize && remaining.length > 0) {
        const diverseIdx = remaining.findIndex(
          (s) => !usedArchetypes.has(s.circle_2_archetype)
        );
        if (diverseIdx !== -1) {
          const s = remaining.splice(diverseIdx, 1)[0];
          usedArchetypes.add(s.circle_2_archetype);
          group.push(s);
        } else {
          group.push(remaining.shift()!);
        }
      }

      // Step 3: Tertiary — check chip diversity (informational, swaps happen in step 4-5)
      const allChips = group.flatMap((s) => s.circle_3_chips);
      const uniqueChips = new Set(allChips);
      const chipDiversity = allChips.length > 0 ? uniqueChips.size / allChips.length : 0;

      // Step 4: Scale balance check
      const scaleDist: Record<string, number> = {};
      for (const s of group) {
        scaleDist[s.circle_4_scale] = (scaleDist[s.circle_4_scale] ?? 0) + 1;
      }
      const scaleBalanced = Object.values(scaleDist).every((count) => count <= 3);

      // Step 5: Voice coverage
      const hasVisual = group.some((s) =>
        s.circle_5_voice.some((v) => VISUAL_CHIPS.includes(v))
      );
      const hasVerbal = group.some((s) =>
        s.circle_5_voice.some((v) => VERBAL_CHIPS.includes(v))
      );

      // Assess composition
      const archetypesInGroup = group.map((s) => s.circle_2_archetype);
      const missingArchetypes = TARGET_ARCHETYPES.filter(
        (a) => !archetypesInGroup.includes(a)
      );

      const compromises: string[] = [];
      if (missingArchetypes.length > 0) {
        compromises.push(`Missing archetypes: ${missingArchetypes.join(", ")}`);
      }
      if (!scaleBalanced) {
        compromises.push("Scale imbalance: >3 students selected same scale option");
      }
      if (!hasVisual) {
        compromises.push("No visual communicator (draw/prototype/poster)");
      }
      if (!hasVerbal) {
        compromises.push("No verbal communicator (explain out loud/write)");
      }

      allGroups.push({
        group_number: groupCounter,
        student_ids: group.map((s) => s.id),
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

  // ── Step 4 & 5 cross-group swaps ──
  // Attempt swaps between groups in the same category pool to fix imbalances
  for (const [, pool] of pools) {
    const poolGroupNums = allGroups
      .filter((g) => g.composition.category === pool[0]?.circle_1_category)
      .map((g) => g.group_number);

    if (poolGroupNums.length < 2) continue;

    const poolGroups = allGroups.filter((g) => poolGroupNums.includes(g.group_number));

    // Try to fix voice coverage gaps via swaps
    for (const group of poolGroups) {
      if (group.composition.has_visual && group.composition.has_verbal) continue;

      const needsVisual = !group.composition.has_visual;
      const needsVerbal = !group.composition.has_verbal;

      for (const other of poolGroups) {
        if (other.group_number === group.group_number) continue;

        // Find a student in `other` that has what `group` needs
        // and whose removal wouldn't break `other`'s coverage
        for (let i = 0; i < other.student_ids.length; i++) {
          const candidateId = other.student_ids[i];
          const candidate = students.find((s) => s.id === candidateId);
          if (!candidate) continue;

          const candidateHasVisual = candidate.circle_5_voice.some((v) => VISUAL_CHIPS.includes(v));
          const candidateHasVerbal = candidate.circle_5_voice.some((v) => VERBAL_CHIPS.includes(v));

          if (needsVisual && !candidateHasVisual) continue;
          if (needsVerbal && !candidateHasVerbal) continue;

          // Check that removing this candidate doesn't break `other`'s coverage
          const otherWithout = other.student_ids.filter((id) => id !== candidateId);
          const otherStudents = otherWithout.map((id) => students.find((s) => s.id === id)!).filter(Boolean);

          if (needsVisual && candidateHasVisual) {
            const otherStillHasVisual = otherStudents.some((s) =>
              s.circle_5_voice.some((v) => VISUAL_CHIPS.includes(v))
            );
            if (!otherStillHasVisual) continue; // swap would break other group
          }

          if (needsVerbal && candidateHasVerbal) {
            const otherStillHasVerbal = otherStudents.some((s) =>
              s.circle_5_voice.some((v) => VERBAL_CHIPS.includes(v))
            );
            if (!otherStillHasVerbal) continue;
          }

          // Find someone in `group` to swap with
          for (let j = 0; j < group.student_ids.length; j++) {
            const swapId = group.student_ids[j];
            const swapStudent = students.find((s) => s.id === swapId);
            if (!swapStudent) continue;

            // Perform swap
            group.student_ids[j] = candidateId;
            other.student_ids[i] = swapId;

            // Update composition flags
            if (needsVisual) group.composition.has_visual = true;
            if (needsVerbal) group.composition.has_verbal = true;

            // Remove the resolved compromise
            group.composition.compromises = group.composition.compromises.filter(
              (c) => !c.includes("visual") && !c.includes("verbal")
            );
            group.composition.all_criteria_met =
              group.composition.missing_archetypes.length === 0 &&
              group.composition.has_visual &&
              group.composition.has_verbal;

            break; // done with this group's voice gap
          }
          break; // only one swap per gap
        }
      }
    }
  }

  // ── Write results to database ──
  // Clear existing groups for this class code
  await supabase
    .from("invention_groups")
    .delete()
    .eq("class_code", classCode);

  // Insert new groups
  for (const group of allGroups) {
    await supabase.from("invention_groups").insert({
      class_code: classCode,
      group_number: group.group_number,
      student_ids: group.student_ids,
      composition_log: group.composition,
    });

    // Update each student's group_number
    for (const studentId of group.student_ids) {
      await supabase
        .from("invention_sessions")
        .update({ group_number: group.group_number })
        .eq("student_id", studentId)
        .eq("class_code", classCode);
    }
  }

  const log: AlgorithmLog = {
    ran_at: new Date().toISOString(),
    total_students: students.length,
    total_groups: allGroups.length,
    groups_meeting_all_criteria: allGroups.filter((g) => g.composition.all_criteria_met).length,
    groups_with_compromises: allGroups.filter((g) => !g.composition.all_criteria_met).length,
    details: allGroups,
  };

  return { log };
}
