"use server";

import { createClient } from "@/lib/supabase/server";
import { recordHandoff, unlockCharacter } from "@/lib/character-system";

/**
 * Records a character handoff and updates the conversation's active character.
 */
export async function acceptHandoff(
  conversationId: string,
  fromCharacter: string,
  toCharacter: string,
  triggerMessage: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Record the handoff event
  await recordHandoff(supabase, user.id, fromCharacter, toCharacter, triggerMessage);

  // Update conversation context_snapshot with new active character
  const { data: convo } = await supabase
    .from("ai_conversations")
    .select("context_snapshot")
    .eq("id", conversationId)
    .eq("student_id", user.id)
    .single();

  const currentSnapshot =
    (convo?.context_snapshot as Record<string, unknown>) ?? {};

  await supabase
    .from("ai_conversations")
    .update({
      context_snapshot: {
        ...currentSnapshot,
        character_key: toCharacter,
      },
    })
    .eq("id", conversationId)
    .eq("student_id", user.id);
}

/**
 * Returns whether the student has unlocked a given character.
 */
export async function checkCharacterUnlock(
  characterKey: string,
): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("student_unlocked_characters")
    .select("id")
    .eq("student_id", user.id)
    .eq("character_key", characterKey)
    .maybeSingle();

  return !!data;
}

/**
 * Marks a character as unlocked for the current student. Idempotent.
 */
export async function markCharacterUnlocked(
  characterKey: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  await unlockCharacter(supabase, user.id, characterKey);
}
