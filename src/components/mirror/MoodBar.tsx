const MOOD_COLORS: Record<string, string> = {
  engaged: "#0D9488",
  frustrated: "#F59E0B",
  anxious: "#FBBF24",
  deflated: "#9CA3AF",
  manic: "#3B82F6",
  flat: "#E5E7EB",
  returning: "#6366F1",
  skipped: "#E5E7EB",
};

interface MoodBarProps {
  /** Array of emotion strings in chronological order */
  emotions: (string | null)[];
  /** Height in pixels */
  height?: number;
}

/**
 * Horizontal mood journey bar. Each segment represents one reflection entry.
 * Color shows the emotional state. The bar reads like a heartbeat of the student's journey.
 */
export default function MoodBar({ emotions, height = 6 }: MoodBarProps) {
  if (emotions.length === 0) return null;

  const label = emotions
    .map((e) => e ?? "skipped")
    .join(", ");

  return (
    <div
      className="flex gap-[3px] rounded-[3px] overflow-hidden"
      style={{ height }}
      role="img"
      aria-label={`Your emotional journey: ${label}`}
    >
      {emotions.map((emotion, i) => (
        <div
          key={i}
          className="flex-1 rounded-[3px]"
          style={{ background: MOOD_COLORS[emotion ?? "skipped"] ?? MOOD_COLORS.skipped }}
          title={emotion ?? "skipped"}
        />
      ))}
    </div>
  );
}
