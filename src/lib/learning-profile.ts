/**
 * Student Learning Profile
 *
 * Accumulates over time from lesson conversations.
 * The AI reads this to adapt its tone, pace, and teaching style.
 */

export interface LearningProfile {
  style: "direct" | "exploratory" | "cautious" | "unknown";
  pace: "fast" | "moderate" | "slow" | "unknown";
  detail_preference: "concise" | "detailed" | "unknown";
  engagement_notes: string[]; // AI observations like "responds well to examples"
  updated_at: string;
}

export const DEFAULT_LEARNING_PROFILE: LearningProfile = {
  style: "unknown",
  pace: "unknown",
  detail_preference: "unknown",
  engagement_notes: [],
  updated_at: new Date().toISOString(),
};

/**
 * Build a system prompt fragment describing the student's learning style.
 * Returns empty string if profile is unknown.
 */
export function learningProfilePrompt(profile: LearningProfile): string {
  if (profile.style === "unknown" && profile.pace === "unknown") {
    return "";
  }

  const parts: string[] = [];

  if (profile.style !== "unknown") {
    const styleMap = {
      direct: "This student is straight to the point. Keep your responses short and action-oriented. Skip the preamble.",
      exploratory: "This student is curious and likes to explore ideas. Feel free to share interesting tangents and ask follow-up questions.",
      cautious: "This student is more hesitant and careful. Be extra encouraging. Break things into smaller steps. Validate their thinking before pushing further.",
    };
    parts.push(styleMap[profile.style]);
  }

  if (profile.pace !== "unknown") {
    const paceMap = {
      fast: "They grasp concepts quickly. Move faster through checkpoints when they demonstrate understanding.",
      moderate: "They learn at a normal pace. One concept at a time.",
      slow: "They need more time and repetition. Use more examples and check understanding before moving on.",
    };
    parts.push(paceMap[profile.pace]);
  }

  if (profile.detail_preference !== "unknown") {
    const detailMap = {
      concise: "They prefer short, punchy responses. No long explanations unless they ask.",
      detailed: "They like thorough explanations with examples and context.",
    };
    parts.push(detailMap[profile.detail_preference]);
  }

  if (profile.engagement_notes.length > 0) {
    parts.push(`Notes from previous lessons: ${profile.engagement_notes.slice(-3).join(". ")}`);
  }

  return `\n\nSTUDENT LEARNING STYLE:\n${parts.join("\n")}`;
}
