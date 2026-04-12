const EMOTION_COLORS: Record<string, string> = {
  engaged: "#0D9488",
  frustrated: "#F59E0B",
  anxious: "#FBBF24",
  deflated: "#9CA3AF",
  manic: "#3B82F6",
  flat: "#E5E7EB",
};

interface EmotionalDotProps {
  emotion?: string | null;
  size?: number;
}

export default function EmotionalDot({ emotion, size = 8 }: EmotionalDotProps) {
  const color = EMOTION_COLORS[emotion ?? "engaged"] ?? EMOTION_COLORS.engaged;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Feeling ${emotion ?? "engaged"}`}
      className="shrink-0"
    >
      <circle cx={size / 2} cy={size / 2} r={size / 2} fill={color} />
    </svg>
  );
}
