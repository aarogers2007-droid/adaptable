import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Invention Mode Grouping Algorithm
 *
 * Five-step sort with cohort-aware scaling:
 *   1. Primary: Pool by category (LARGE) or archetype (MEDIUM/SMALL)
 *   2. Secondary: Circle 2 archetype mix (hard or soft per mode)
 *   3. Tertiary: Circle 3 chips (maximize diversity within groups)
 *   4. Balance: Circle 4 scale (no more than 3 of same scale per group)
 *   5. Role mapping: Circle 5 voice (visual + verbal coverage)
 *
 * Three cohort modes:
 *   LARGE  (80+): Full constraint enforcement, category-first pooling
 *   MEDIUM (30-79): Archetype-first pooling, category relaxed to soft
 *   SMALL  (<30): Archetype-first, only archetype hard, no cross-group swaps
 */

// ── Cohort types and constants ──

export type CohortMode = "LARGE" | "MEDIUM" | "SMALL";

export const LARGE_COHORT_THRESHOLD = 80;
export const MEDIUM_COHORT_THRESHOLD = 30;
const MAX_SWAP_ITERATIONS = 100;

type ConstraintDimension = "archetype" | "ambition" | "category" | "lens" | "voice";

export interface ConstraintConfig {
  primarySort: "category" | "archetype";
  hardConstraints: ConstraintDimension[];
  softConstraints: ConstraintDimension[];
  swapEnabled: boolean;
}

export interface GroupSizeRecommendation {
  min: number;
  max: number;
  recommended: number;
  remainder: number;
}

export interface AlgorithmPreview {
  studentCount: number;
  completedCount: number;
  incompleteCount: number;
  mode: CohortMode;
  modeLabel: string;
  recommendedGroupSize: number;
  projectedGroupCount: number;
  projectedRemainder: number;
  groupSizeDistribution: string;
  archetypeBreakdown: Record<string, number>;
  ambitionBreakdown: Record<string, number>;
  warnings: string[];
}

// ── Constraint configs per mode ──

const LARGE_CONFIG: ConstraintConfig = {
  primarySort: "category",
  hardConstraints: ["archetype", "ambition", "category"],
  softConstraints: ["lens", "voice"],
  swapEnabled: true,
};

const MEDIUM_CONFIG: ConstraintConfig = {
  primarySort: "archetype",
  hardConstraints: ["archetype", "ambition"],
  softConstraints: ["category", "lens", "voice"],
  swapEnabled: true,
};

const SMALL_CONFIG: ConstraintConfig = {
  primarySort: "archetype",
  hardConstraints: ["archetype"],
  softConstraints: ["ambition", "category", "lens", "voice"],
  swapEnabled: false,
};

// ── Pure functions ──

export function getCohortMode(studentCount: number): CohortMode {
  if (studentCount >= LARGE_COHORT_THRESHOLD) return "LARGE";
  if (studentCount >= MEDIUM_COHORT_THRESHOLD) return "MEDIUM";
  return "SMALL";
}

export function getConstraintConfig(mode: CohortMode): ConstraintConfig {
  if (mode === "LARGE") return LARGE_CONFIG;
  if (mode === "MEDIUM") return MEDIUM_CONFIG;
  return SMALL_CONFIG;
}

function getModeLabel(mode: CohortMode): string {
  if (mode === "LARGE") return "Large Cohort (80+)";
  if (mode === "MEDIUM") return "Medium Cohort (30-79)";
  return "Small Cohort (<30)";
}

export function recommendGroupSize(studentCount: number, mode: CohortMode): GroupSizeRecommendation {
  const ranges: Record<CohortMode, { min: number; max: number; prefer: number }> = {
    LARGE: { min: 4, max: 6, prefer: 5 },
    MEDIUM: { min: 3, max: 5, prefer: 5 },
    SMALL: { min: 3, max: 4, prefer: 4 },
  };

  const { min, max, prefer } = ranges[mode];

  if (studentCount <= 0) {
    return { min, max, recommended: prefer, remainder: 0 };
  }

  // Try each candidate size, starting from preferred and expanding outward
  let bestSize = prefer;
  let bestRemainder = studentCount % prefer;

  for (let size = min; size <= max; size++) {
    const remainder = studentCount % size;
    if (remainder < bestRemainder || (remainder === bestRemainder && size > bestSize)) {
      bestSize = size;
      bestRemainder = remainder;
    }
  }

  return { min, max, recommended: bestSize, remainder: bestRemainder };
}

function formatDistribution(studentCount: number, groupSize: number): string {
  if (studentCount <= 0) return "No students";
  const fullGroups = Math.floor(studentCount / groupSize);
  const remainder = studentCount % groupSize;
  if (remainder === 0) {
    return `${fullGroups} groups of ${groupSize}`;
  }
  // Distribute remainder: last `remainder` groups get one extra student
  const normalGroups = fullGroups - remainder;
  const largerGroups = remainder;
  if (normalGroups <= 0) {
    return `${largerGroups} groups of ${groupSize + 1}`;
  }
  return `${normalGroups} groups of ${groupSize}, ${largerGroups} groups of ${groupSize + 1}`;
}

// ── Minimum viable group guarantee ──

const MAKER_ARCHETYPES = ["builder", "systems_thinker"];
const PEOPLE_ARCHETYPES = ["empath", "connector"];
const FLEX_ARCHETYPE = "storyteller"; // can fill either role

function checkMinimumViable(archetypes: string[]): { met: boolean; details: string | null } {
  const hasMaker = archetypes.some((a) => MAKER_ARCHETYPES.includes(a));
  const hasPeople = archetypes.some((a) => PEOPLE_ARCHETYPES.includes(a));
  const storytellerCount = archetypes.filter((a) => a === FLEX_ARCHETYPE).length;

  if (hasMaker && hasPeople) return { met: true, details: null };

  // Storyteller can fill one missing role
  if (!hasMaker && !hasPeople && storytellerCount >= 2) {
    return { met: true, details: "Storytellers filling both maker and people roles" };
  }
  if ((!hasMaker || !hasPeople) && storytellerCount >= 1) {
    const filled = !hasMaker ? "maker" : "people";
    return { met: true, details: `Storyteller filling ${filled} role` };
  }

  const missing: string[] = [];
  if (!hasMaker) missing.push("no Builder or Systems Thinker");
  if (!hasPeople) missing.push("no Empath or Connector");
  return { met: false, details: `Missing: ${missing.join(", ")}` };
}

// ── Core types (unchanged) ──

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
    chip_diversity: number;
    scale_distribution: Record<string, number>;
    has_visual: boolean;
    has_verbal: boolean;
    all_criteria_met: boolean;
    compromises: string[];
    // New cohort-aware fields
    cohort_mode: CohortMode;
    constraint_config: { hard: string[]; soft: string[] };
    minimum_viable_guarantee: "met" | "warning";
    minimum_viable_details: string | null;
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
  targetGroupSize?: number
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

  // ── Cohort detection ──
  const mode = getCohortMode(students.length);
  const config = getConstraintConfig(mode);
  const groupSize = targetGroupSize ?? recommendGroupSize(students.length, mode).recommended;

  const isHard = (dim: ConstraintDimension) => config.hardConstraints.includes(dim);

  // ── Step 1: Primary sort — pool by category (LARGE) or archetype (MEDIUM/SMALL) ──
  const pools = new Map<string, Student[]>();
  for (const s of students) {
    const poolKey = config.primarySort === "category" ? s.circle_1_category : s.circle_2_archetype;
    const pool = pools.get(poolKey) ?? [];
    pool.push(s);
    pools.set(poolKey, pool);
  }

  // ── Step 2-5: Form groups within each pool ──
  const allGroups: GroupResult[] = [];
  let groupCounter = 1;

  for (const [poolKey, pool] of pools) {
    const remaining = [...pool];
    // In LARGE mode, poolKey is category. In MEDIUM/SMALL, poolKey is archetype.
    // For composition_log.category, use the actual category of the first student in the pool.
    const poolCategory = config.primarySort === "category" ? poolKey : (pool[0]?.circle_1_category ?? "mixed");

    while (remaining.length > 0) {
      // If fewer than 3 students remain, merge them into the last group
      // in this pool rather than creating a tiny group
      if (remaining.length < 3 && allGroups.length > 0) {
        const lastPoolGroup = [...allGroups].reverse().find(
          (g) => g.composition.category === poolCategory
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
      if (isHard("archetype") && missingArchetypes.length > 0) {
        compromises.push(`Missing archetypes: ${missingArchetypes.join(", ")}`);
      } else if (!isHard("archetype") && missingArchetypes.length > 0) {
        compromises.push(`Soft: missing archetypes ${missingArchetypes.join(", ")} (not enforced in ${mode} mode)`);
      }
      if (isHard("ambition") && !scaleBalanced) {
        compromises.push("Scale imbalance: >3 students selected same scale option");
      } else if (!isHard("ambition") && !scaleBalanced) {
        compromises.push(`Soft: scale imbalance (not enforced in ${mode} mode)`);
      }
      if (!hasVisual) {
        compromises.push("No visual communicator (draw/prototype/poster)");
      }
      if (!hasVerbal) {
        compromises.push("No verbal communicator (explain out loud/write)");
      }

      // Minimum viable guarantee
      const mvg = checkMinimumViable(archetypesInGroup);

      allGroups.push({
        group_number: groupCounter,
        student_ids: group.map((s) => s.id),
        composition: {
          category: poolCategory,
          archetypes: archetypesInGroup,
          missing_archetypes: missingArchetypes,
          chip_diversity: Math.round(chipDiversity * 100) / 100,
          scale_distribution: scaleDist,
          has_visual: hasVisual,
          has_verbal: hasVerbal,
          all_criteria_met: missingArchetypes.length === 0 && scaleBalanced && hasVisual && hasVerbal,
          compromises,
          cohort_mode: mode,
          constraint_config: { hard: [...config.hardConstraints], soft: [...config.softConstraints] },
          minimum_viable_guarantee: mvg.met ? "met" : "warning",
          minimum_viable_details: mvg.details,
        },
      });

      groupCounter++;
    }
  }

  // ── Step 4 & 5 cross-group swaps (only if enabled for this mode) ──
  if (config.swapEnabled) {
    for (const [, pool] of pools) {
      const poolCategory = config.primarySort === "category"
        ? pool[0]?.circle_1_category
        : pool[0]?.circle_1_category; // For non-LARGE, match by category of pool members
      const poolGroupNums = allGroups
        .filter((g) => g.composition.category === poolCategory)
        .map((g) => g.group_number);

      if (poolGroupNums.length < 2) continue;

      const poolGroups = allGroups.filter((g) => poolGroupNums.includes(g.group_number));

      for (const group of poolGroups) {
        if (group.composition.has_visual && group.composition.has_verbal) continue;

        const needsVisual = !group.composition.has_visual;
        const needsVerbal = !group.composition.has_verbal;

        for (const other of poolGroups) {
          if (other.group_number === group.group_number) continue;

          for (let i = 0; i < other.student_ids.length; i++) {
            const candidateId = other.student_ids[i];
            const candidate = students.find((s) => s.id === candidateId);
            if (!candidate) continue;

            const candidateHasVisual = candidate.circle_5_voice.some((v) => VISUAL_CHIPS.includes(v));
            const candidateHasVerbal = candidate.circle_5_voice.some((v) => VERBAL_CHIPS.includes(v));

            if (needsVisual && !candidateHasVisual) continue;
            if (needsVerbal && !candidateHasVerbal) continue;

            const otherWithout = other.student_ids.filter((id) => id !== candidateId);
            const otherStudents = otherWithout.map((id) => students.find((s) => s.id === id)!).filter(Boolean);

            if (needsVisual && candidateHasVisual) {
              const otherStillHasVisual = otherStudents.some((s) =>
                s.circle_5_voice.some((v) => VISUAL_CHIPS.includes(v))
              );
              if (!otherStillHasVisual) continue;
            }

            if (needsVerbal && candidateHasVerbal) {
              const otherStillHasVerbal = otherStudents.some((s) =>
                s.circle_5_voice.some((v) => VERBAL_CHIPS.includes(v))
              );
              if (!otherStillHasVerbal) continue;
            }

            for (let j = 0; j < group.student_ids.length; j++) {
              const swapId = group.student_ids[j];
              const _swapStudent = students.find((s) => s.id === swapId);
              if (!_swapStudent) continue;

              group.student_ids[j] = candidateId;
              other.student_ids[i] = swapId;

              if (needsVisual) group.composition.has_visual = true;
              if (needsVerbal) group.composition.has_verbal = true;

              group.composition.compromises = group.composition.compromises.filter(
                (c) => !c.includes("visual") && !c.includes("verbal")
              );
              group.composition.all_criteria_met =
                group.composition.missing_archetypes.length === 0 &&
                group.composition.has_visual &&
                group.composition.has_verbal;

              break;
            }
            break;
          }
        }
      }
    }
  }

  // ── Minimum viable guarantee swaps (all modes) ──
  let mvgIterations = 0;
  for (const group of allGroups) {
    if (group.composition.minimum_viable_guarantee === "met") continue;
    if (mvgIterations >= MAX_SWAP_ITERATIONS) break;

    const groupArchetypes = group.student_ids
      .map((id) => students.find((s) => s.id === id)?.circle_2_archetype ?? "")
      .filter(Boolean);

    const hasMaker = groupArchetypes.some((a) => MAKER_ARCHETYPES.includes(a));
    const hasPeople = groupArchetypes.some((a) => PEOPLE_ARCHETYPES.includes(a));

    if (hasMaker && hasPeople) {
      group.composition.minimum_viable_guarantee = "met";
      group.composition.minimum_viable_details = null;
      continue;
    }

    // Try to swap with another group that has a surplus
    const needsMaker = !hasMaker;
    const neededTypes = needsMaker ? MAKER_ARCHETYPES : PEOPLE_ARCHETYPES;

    let swapped = false;
    for (const other of allGroups) {
      if (other.group_number === group.group_number) continue;
      if (mvgIterations >= MAX_SWAP_ITERATIONS) break;
      mvgIterations++;

      // Check if other has a surplus of the needed type
      const otherArchetypes = other.student_ids
        .map((id) => students.find((s) => s.id === id)?.circle_2_archetype ?? "")
        .filter(Boolean);
      const surplusCount = otherArchetypes.filter((a) => neededTypes.includes(a)).length;
      if (surplusCount < 2) continue; // need at least 2 so removing one still leaves coverage

      // Find the candidate to move
      for (let i = 0; i < other.student_ids.length; i++) {
        const candidate = students.find((s) => s.id === other.student_ids[i]);
        if (!candidate || !neededTypes.includes(candidate.circle_2_archetype)) continue;

        // Find someone in the deficient group to swap back
        for (let j = 0; j < group.student_ids.length; j++) {
          const swapBack = students.find((s) => s.id === group.student_ids[j]);
          if (!swapBack) continue;

          // Check the swap wouldn't break other's minimum viable
          const otherAfterSwap = otherArchetypes.filter((_, idx) => idx !== i);
          otherAfterSwap.push(swapBack.circle_2_archetype);
          const otherMvg = checkMinimumViable(otherAfterSwap);
          if (!otherMvg.met) continue;

          // Perform swap
          group.student_ids[j] = candidate.id;
          other.student_ids[i] = swapBack.id;

          // Update archetypes
          group.composition.archetypes = group.student_ids
            .map((id) => students.find((s) => s.id === id)?.circle_2_archetype ?? "builder");
          group.composition.minimum_viable_guarantee = "met";
          group.composition.minimum_viable_details = `Resolved via swap with Group ${other.group_number}`;
          swapped = true;
          break;
        }
        if (swapped) break;
      }
      if (swapped) break;
    }

    if (!swapped) {
      group.composition.minimum_viable_guarantee = "warning";
      group.composition.minimum_viable_details =
        `Could not resolve: ${needsMaker ? "no Builder or Systems Thinker" : "no Empath or Connector"} — manual reassignment recommended`;
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

/**
 * Read-only preview of what the algorithm would produce.
 * Does NOT write to the database. Used by the admin pre-run summary.
 */
export async function getAlgorithmPreview(
  classCode: string,
  targetGroupSize?: number
): Promise<AlgorithmPreview> {
  const supabase = await createClient();

  // Fetch ALL sessions (completed + incomplete) for counts
  const { data: allSessions } = await supabase
    .from("invention_sessions")
    .select("student_id, circle_1_category, circle_2_archetype, circle_4_scale, completed_at")
    .eq("class_code", classCode);

  const completed = (allSessions ?? []).filter((s) => s.completed_at);
  const incomplete = (allSessions ?? []).filter((s) => !s.completed_at);

  const studentCount = completed.length;
  const mode = getCohortMode(studentCount);
  const rec = recommendGroupSize(studentCount, mode);
  const groupSize = targetGroupSize ?? rec.recommended;
  const projectedGroupCount = studentCount > 0 ? Math.ceil(studentCount / groupSize) : 0;

  // Archetype breakdown
  const archetypeBreakdown: Record<string, number> = {};
  for (const s of completed) {
    const arch = s.circle_2_archetype ?? "unknown";
    archetypeBreakdown[arch] = (archetypeBreakdown[arch] ?? 0) + 1;
  }

  // Ambition breakdown
  const ambitionBreakdown: Record<string, number> = {};
  for (const s of completed) {
    const scale = s.circle_4_scale ?? "unknown";
    ambitionBreakdown[scale] = (ambitionBreakdown[scale] ?? 0) + 1;
  }

  // Warnings
  const warnings: string[] = [];

  const empathCount = (archetypeBreakdown["empath"] ?? 0) + (archetypeBreakdown["connector"] ?? 0);
  const makerCount = (archetypeBreakdown["builder"] ?? 0) + (archetypeBreakdown["systems_thinker"] ?? 0);

  if (empathCount < projectedGroupCount && studentCount > 0) {
    warnings.push(`Only ${empathCount} Empaths/Connectors for ${projectedGroupCount} groups — some groups may lack a people-oriented thinker`);
  }
  if (makerCount < projectedGroupCount && studentCount > 0) {
    warnings.push(`Only ${makerCount} Builders/Systems Thinkers for ${projectedGroupCount} groups — some groups may lack a maker-oriented thinker`);
  }
  if (incomplete.length > 0) {
    warnings.push(`${incomplete.length} students have started but not finished — they will not be grouped`);
  }

  return {
    studentCount,
    completedCount: completed.length,
    incompleteCount: incomplete.length,
    mode,
    modeLabel: getModeLabel(mode),
    recommendedGroupSize: groupSize,
    projectedGroupCount,
    projectedRemainder: rec.remainder,
    groupSizeDistribution: formatDistribution(studentCount, groupSize),
    archetypeBreakdown,
    ambitionBreakdown,
    warnings,
  };
}
