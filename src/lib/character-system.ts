import { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CharacterConfig {
  id: string;
  character_key: string;
  name: string;
  creature: string;
  domain: string;
  personality_summary: string;
  system_prompt: string;
  communication_style: {
    tone: string;
    vocabulary_level: string;
    sentence_length: string;
    formality: string;
  };
  behavioral_rules: {
    always: string[];
    never: string[];
  };
  signature_phrases: string[];
  unlock_condition: string;
  domain_color: string;
  image_url: string | null;
}

export interface StudentContext {
  studentName: string;
  businessName: string;
  niche: string;
  targetCustomer: string;
  revenueModel: string;
  currentLessonTitle?: string;
  recentDecisions: string[];
  recentCheckins: string[];
  lastConfidenceRating?: number;
}

export interface HandoffResult {
  shouldHandoff: boolean;
  targetCharacter?: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a single character config by its key.
 */
export async function getCharacterConfig(
  supabase: SupabaseClient,
  characterKey: string,
): Promise<CharacterConfig | null> {
  const { data, error } = await supabase
    .from("character_system_config")
    .select("*")
    .eq("character_key", characterKey)
    .single();

  if (error || !data) return null;
  return data as unknown as CharacterConfig;
}

/**
 * Fetch all character configs. Used for handoff lists and prompt assembly.
 */
export async function getAllCharacterConfigs(
  supabase: SupabaseClient,
): Promise<CharacterConfig[]> {
  const { data } = await supabase
    .from("character_system_config")
    .select("*")
    .order("character_key");

  return (data ?? []) as unknown as CharacterConfig[];
}

/**
 * Determine which character should be active for a student.
 *
 * Logic:
 *  1. If module/lesson sequence provided, find a character whose
 *     unlock_condition matches (format: "module:N:lesson:N").
 *  2. Otherwise fall back to "nova" (the default guide).
 *  3. Also checks student_unlocked_characters to decide if this is
 *     a first encounter.
 */
export async function getActiveCharacter(
  supabase: SupabaseClient,
  studentId: string,
  lessonModuleSequence?: number,
  lessonSequence?: number,
): Promise<{
  character: CharacterConfig;
  isFirstEncounter: boolean;
} | null> {
  const allConfigs = await getAllCharacterConfigs(supabase);
  if (allConfigs.length === 0) return null;

  let matched: CharacterConfig | undefined;

  if (lessonModuleSequence !== undefined && lessonSequence !== undefined) {
    const conditionString = `module:${lessonModuleSequence}:lesson:${lessonSequence}`;
    matched = allConfigs.find((c) => c.unlock_condition === conditionString);
  }

  // Fall back to Nova (default character)
  if (!matched) {
    matched = allConfigs.find((c) => c.character_key === "nova");
  }

  // If still nothing, take the first config
  if (!matched) {
    matched = allConfigs[0];
  }

  // Check if student has encountered this character before
  const { data: unlocked } = await supabase
    .from("student_unlocked_characters")
    .select("id")
    .eq("student_id", studentId)
    .eq("character_key", matched.character_key)
    .maybeSingle();

  return {
    character: matched,
    isFirstEncounter: !unlocked,
  };
}

// ---------------------------------------------------------------------------
// Prompt template engine (pure — no side effects)
// ---------------------------------------------------------------------------

/**
 * Build the full system prompt for a character given config and context.
 * Pure function: no DB calls, no side effects.
 */
export function assembleCharacterPrompt(
  config: CharacterConfig,
  context: StudentContext,
  allCharacters: CharacterConfig[],
): string {
  const otherCharacters = allCharacters.filter(
    (c) => c.character_key !== config.character_key,
  );

  const otherCharacterList = otherCharacters
    .map((c) => `- ${c.name} the ${c.creature}: ${c.domain}`)
    .join("\n");

  const sections: string[] = [];

  // [IDENTITY]
  sections.push(
    `[IDENTITY]
You are ${config.name}, the ${config.creature}. You are ${context.studentName}'s ${config.domain} guide on Adaptable, an entrepreneurship platform for young builders. Your role is to help them develop their ${config.domain} thinking as they build their business: ${context.businessName}, a ${context.niche} serving ${context.targetCustomer}.`,
  );

  // [PERSONALITY]
  sections.push(
    `[PERSONALITY]
${config.personality_summary}

${config.system_prompt}`,
  );

  // [COMMUNICATION RULES]
  sections.push(
    `[COMMUNICATION RULES]
Tone: ${config.communication_style.tone}
Vocabulary: ${config.communication_style.vocabulary_level}
Sentences: ${config.communication_style.sentence_length}
Formality: ${config.communication_style.formality}

Signature phrases you can use naturally (don't force them): ${config.signature_phrases.join(", ")}`,
  );

  // [BEHAVIORAL BOUNDARIES]
  const alwaysRules = config.behavioral_rules.always.join("\n- ");
  const neverRules = config.behavioral_rules.never.join("\n- ");

  sections.push(
    `[BEHAVIORAL BOUNDARIES]
You ALWAYS:
- ${alwaysRules}

You NEVER:
- ${neverRules}

Additional universal rules:
- Reference the student's actual business in every response
- End with either a question or a specific next step
- Keep responses under 150 words unless the student asks for more
- Never use bullet points in casual conversation
- Never give generic advice that ignores the student's specific business
- Never use language that talks down to a teenager`,
  );

  // [HANDOFF PROTOCOL]
  if (otherCharacters.length > 0) {
    const firstOther = otherCharacters[0];
    sections.push(
      `[HANDOFF PROTOCOL]
You are an expert in ${config.domain}. Other characters on the platform and their domains:
${otherCharacterList}
When a student asks about something outside your domain, acknowledge it briefly and name the right character. Example: "That's really a question for ${firstOther.name} — they're the one who handles ${firstOther.domain}. What I can tell you from a ${config.domain} perspective is..."
Never pretend to be an expert in another character's domain.`,
    );
  }

  // [STUDENT CONTEXT]
  const contextLines: string[] = [];
  if (context.currentLessonTitle) {
    contextLines.push(`Current lesson: ${context.currentLessonTitle}`);
  }
  if (context.recentDecisions.length > 0) {
    contextLines.push(
      `Recent decisions:\n${context.recentDecisions.map((d) => `- ${d}`).join("\n")}`,
    );
  }
  if (context.recentCheckins.length > 0) {
    contextLines.push(
      `Recent check-ins:\n${context.recentCheckins.map((c) => `- ${c}`).join("\n")}`,
    );
  }
  if (context.lastConfidenceRating !== undefined) {
    contextLines.push(
      `Last confidence rating: ${context.lastConfidenceRating}/10`,
    );
  }

  if (contextLines.length > 0) {
    sections.push(`[STUDENT CONTEXT]\n${contextLines.join("\n")}`);
  }

  return sections.join("\n\n");
}

// ---------------------------------------------------------------------------
// Handoff detection (pure — keyword matching, no AI calls)
// ---------------------------------------------------------------------------

/**
 * Detect if a student's message is asking about another character's domain.
 * Uses simple keyword matching against each character's domain field.
 */
export function detectHandoff(
  message: string,
  currentCharacter: CharacterConfig,
  allCharacters: CharacterConfig[],
): HandoffResult {
  const lowerMessage = message.toLowerCase();

  const others = allCharacters.filter(
    (c) => c.character_key !== currentCharacter.character_key,
  );

  for (const other of others) {
    // Split domain into keywords (e.g. "financial strategy" -> ["financial", "strategy"])
    const domainKeywords = other.domain
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3); // skip short words like "and", "the"

    // Check if at least one domain keyword appears in the message
    const matchedKeywords = domainKeywords.filter((kw) =>
      lowerMessage.includes(kw),
    );

    // Also check for the character's name being mentioned
    const nameMatch = lowerMessage.includes(other.name.toLowerCase());

    if (matchedKeywords.length >= 1 || nameMatch) {
      return {
        shouldHandoff: true,
        targetCharacter: other.character_key,
        reason: nameMatch
          ? `Student mentioned ${other.name} by name`
          : `Message contains ${other.domain} keywords: ${matchedKeywords.join(", ")}`,
      };
    }
  }

  return { shouldHandoff: false };
}

// ---------------------------------------------------------------------------
// Unlock & handoff tracking (DB operations)
// ---------------------------------------------------------------------------

/**
 * Get all character keys the student has unlocked.
 */
export async function getUnlockedCharacters(
  supabase: SupabaseClient,
  studentId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("student_unlocked_characters")
    .select("character_key")
    .eq("student_id", studentId);

  return (data ?? []).map(
    (row: { character_key: string }) => row.character_key,
  );
}

/**
 * Unlock a character for a student. Idempotent — ignores conflicts.
 */
export async function unlockCharacter(
  supabase: SupabaseClient,
  studentId: string,
  characterKey: string,
): Promise<void> {
  await supabase
    .from("student_unlocked_characters")
    .upsert(
      {
        student_id: studentId,
        character_key: characterKey,
      },
      { onConflict: "student_id,character_key" },
    );
}

/**
 * Record a handoff event between characters.
 */
export async function recordHandoff(
  supabase: SupabaseClient,
  studentId: string,
  fromCharacter: string,
  toCharacter: string,
  triggerMessage: string,
): Promise<void> {
  await supabase.from("character_handoffs").insert({
    student_id: studentId,
    from_character: fromCharacter,
    to_character: toCharacter,
    trigger_message: triggerMessage,
  });
}
