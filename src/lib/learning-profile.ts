/**
 * Student Learning Profile
 *
 * Accumulates over time from lesson conversations.
 * The AI reads this to adapt its tone, pace, and teaching style.
 *
 * All dimensions are detected behaviorally from actual responses,
 * not self-reported. Updates after every AI message.
 */

export interface LearningProfile {
  style: "direct" | "exploratory" | "cautious" | "unknown";
  pace: "fast" | "moderate" | "slow" | "unknown";
  detail_preference: "concise" | "detailed" | "unknown";
  motivation: "validation" | "challenge" | "unknown";
  register: "formal" | "casual" | "slang" | "academic" | "bilingual" | "minimal" | "unknown";
  engagement_notes: string[];
  updated_at: string;
}

export const DEFAULT_LEARNING_PROFILE: LearningProfile = {
  style: "unknown",
  pace: "unknown",
  detail_preference: "unknown",
  motivation: "unknown",
  register: "unknown",
  engagement_notes: [],
  updated_at: new Date().toISOString(),
};

/**
 * Build a system prompt fragment describing the student's learning style.
 * Returns empty string if profile is all unknown.
 */
export function learningProfilePrompt(profile: LearningProfile): string {
  if (
    profile.style === "unknown" &&
    profile.pace === "unknown" &&
    profile.motivation === "unknown"
  ) {
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

  if (profile.motivation !== "unknown") {
    const motivationMap = {
      validation: "This student responds well to encouragement and affirmation. Acknowledge their good thinking before pushing further. Lead with what they got right.",
      challenge: "This student is motivated by being pushed. They respect directness and tough questions. Don't sugarcoat — challenge their assumptions and they'll rise to it.",
    };
    parts.push(motivationMap[profile.motivation]);
  }

  if (profile.register !== "unknown") {
    const registerMap = {
      formal: "This student writes formally. Match their precision. Don't be overly casual or use slang.",
      casual: "This student is casual. Match their energy. Relaxed tone works well.",
      slang: "This student uses heavy slang and abbreviations. Keep it relaxed. Don't correct their language. Match their vibe.",
      academic: "This student thinks analytically. Match their depth. Skip basic explanations. They may know more than the default curriculum assumes.",
      bilingual: "This student code-switches between languages. Acknowledge both languages warmly. Never translate their non-English words back to English.",
      minimal: "This student communicates in very few words. Do NOT treat brevity as vagueness. Ask tight yes/no or choice questions instead of open-ended prompts. Match their brevity. 1-2 sentences max from you.",
    };
    parts.push(registerMap[profile.register]);
  }

  if (profile.engagement_notes.length > 0) {
    parts.push(`Notes from previous lessons: ${profile.engagement_notes.slice(-3).join(". ")}`);
  }

  return `\n\nSTUDENT LEARNING STYLE:\n${parts.join("\n")}`;
}
