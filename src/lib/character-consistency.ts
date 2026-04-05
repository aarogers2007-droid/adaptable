import { SupabaseClient } from "@supabase/supabase-js";
import type { CharacterConfig, StudentContext } from "./character-system";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConsistencyResult {
  passed: boolean;
  failures: string[];
  correctedPrompt?: string;
}

// ---------------------------------------------------------------------------
// Consistency checking (synchronous, pure)
// ---------------------------------------------------------------------------

/**
 * Check an AI response for consistency with character rules and student context.
 * Runs synchronously on text — no async, no side effects.
 */
export function checkConsistency(
  response: string,
  characterConfig: CharacterConfig,
  studentContext: StudentContext,
): ConsistencyResult {
  const failures: string[] = [];
  let hasCriticalFailure = false;

  // 1. Length check — word count
  const wordCount = response
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  if (wordCount > 180) {
    failures.push(`Response too long: ${wordCount} words (max 180)`);
    hasCriticalFailure = true;
  } else if (wordCount > 120) {
    failures.push(`Response approaching limit: ${wordCount} words (warn at 120)`);
  }

  // 2. Business reference — business name or niche must appear
  const lowerResponse = response.toLowerCase();
  const hasBusinessName =
    studentContext.businessName &&
    lowerResponse.includes(studentContext.businessName.toLowerCase());
  const hasNiche =
    studentContext.niche &&
    lowerResponse.includes(studentContext.niche.toLowerCase());

  if (!hasBusinessName && !hasNiche) {
    failures.push(
      `No business reference: neither "${studentContext.businessName}" nor "${studentContext.niche}" found`,
    );
    hasCriticalFailure = true;
  }

  // 3. Ends with question or action
  const trimmedResponse = response.trim();
  const sentences = trimmedResponse.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const lastSentence = sentences[sentences.length - 1]?.trim().toLowerCase() ?? "";
  const endsWithQuestion = trimmedResponse.endsWith("?");
  const actionWords = [
    "try",
    "start",
    "think about",
    "consider",
    "do",
    "make",
    "create",
    "build",
    "test",
    "ask",
  ];
  const hasActionWord = actionWords.some((word) => lastSentence.includes(word));

  if (!endsWithQuestion && !hasActionWord) {
    failures.push(
      "Response doesn't end with a question or actionable next step",
    );
  }

  // 4. No bullet points
  const lines = response.split("\n");
  const hasBullets = lines.some(
    (line) =>
      /^\s*[-*]\s/.test(line) || /^\s*\d+\.\s/.test(line),
  );

  if (hasBullets) {
    failures.push("Response contains bullet points (not allowed in casual conversation)");
  }

  // 5. Banned patterns from behavioral_rules.never
  if (characterConfig.behavioral_rules?.never) {
    for (const rule of characterConfig.behavioral_rules.never) {
      // Extract key phrases from the rule to check against the response
      const ruleWords = rule
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4);

      // If many key words from the rule appear in the response, flag it
      const matchCount = ruleWords.filter((w) =>
        lowerResponse.includes(w),
      ).length;

      if (ruleWords.length > 0 && matchCount >= Math.ceil(ruleWords.length * 0.6)) {
        failures.push(`Possible "never" rule violation: "${rule}"`);
      }
    }
  }

  // Build corrected prompt if critical failures
  let correctedPrompt: string | undefined;
  if (hasCriticalFailure) {
    const corrections: string[] = [];
    if (wordCount > 180) {
      corrections.push("keep it under 150 words");
    }
    if (!hasBusinessName && !hasNiche) {
      corrections.push(`mention "${studentContext.businessName}" by name`);
    }
    correctedPrompt = `CRITICAL: Your previous response needs adjustment. Please regenerate and: ${corrections.join("; ")}.`;
  }

  return {
    passed: failures.length === 0,
    failures,
    correctedPrompt,
  };
}

// ---------------------------------------------------------------------------
// Consistency failure logging (async DB operation)
// ---------------------------------------------------------------------------

/**
 * Log a consistency failure to the character_consistency_log table.
 */
export async function logConsistencyFailure(
  supabase: SupabaseClient,
  studentId: string,
  characterKey: string,
  failureType: string,
  originalResponse: string,
): Promise<void> {
  await supabase.from("character_consistency_log").insert({
    student_id: studentId,
    character_key: characterKey,
    failure_type: failureType,
    original_response: originalResponse,
  });
}
