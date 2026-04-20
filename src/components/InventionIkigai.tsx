"use client";

/**
 * Invention Ikigai — five circles in a pentagon, same visual style
 * as the 4-circle Ikigai on /for-schools. Circles overlap slightly
 * at edges. Labels outside. Clickable when onCircleClick provided.
 */

interface InventionIkigaiProps {
  currentCircle?: number;
  completedCircles?: number[];
  onCircleClick?: (circle: number) => void;
}

const CIRCLES = [
  { num: 1, name: "The Wish", color: "#C084FC" },
  { num: 2, name: "The Mind", color: "#60A5FA" },
  { num: 3, name: "The Lens", color: "#2DD4BF" },
  { num: 4, name: "The Scale", color: "#FBBF24" },
  { num: 5, name: "The Voice", color: "#F87171" },
];

// Same approach as the 4-circle Ikigai: viewBox 100x100, r=18,
// pentagon inscribed at radius 24 from center (50,50).
// Adjacent circles overlap slightly (distance ~28, diameter 36).
const R = 18;
const POSITIONS = [
  { cx: 50, cy: 27 },    // 1: top
  { cx: 27, cy: 44 },    // 2: upper-left
  { cx: 73, cy: 44 },    // 3: upper-right
  { cx: 33, cy: 70 },    // 4: lower-left
  { cx: 67, cy: 70 },    // 5: lower-right
];

// Labels positioned outside each circle
const LABELS = [
  { text: "The Wish", x: 50, y: 5, anchor: "middle" as const },
  { text: "The Mind", x: 4, y: 38, anchor: "start" as const },
  { text: "The Lens", x: 96, y: 38, anchor: "end" as const },
  { text: "The Scale", x: 10, y: 88, anchor: "start" as const },
  { text: "The Voice", x: 90, y: 88, anchor: "end" as const },
];

export default function InventionIkigai({
  currentCircle = 0,
  completedCircles = [],
  onCircleClick,
}: InventionIkigaiProps) {
  return (
    <div
      className="relative mx-auto w-full max-w-[480px]"
      style={{ aspectRatio: "1 / 1" }}
    >
      <svg
        className="absolute inset-0 w-full h-full overflow-visible"
        viewBox="0 0 100 100"
        style={{ zIndex: 1 }}
      >
        {/* Circles */}
        {CIRCLES.map((circle, i) => {
          const pos = POSITIONS[i];
          const isActive = currentCircle === circle.num;
          const isCompleted = completedCircles.includes(circle.num);
          const isClickable = !!onCircleClick && !isActive;
          const opacity = isActive ? 0.7 : isCompleted ? 0.55 : 0.45;

          return (
            <circle
              key={circle.num}
              cx={pos.cx}
              cy={pos.cy}
              r={R}
              fill={circle.color}
              opacity={opacity}
              stroke={isActive ? circle.color : "none"}
              strokeWidth={isActive ? 1.5 : 0}
              style={{
                cursor: isClickable ? "pointer" : "default",
                transition: "opacity 0.3s",
                filter: isActive ? `drop-shadow(0 0 6px ${circle.color})` : "none",
              }}
              onClick={() => isClickable && onCircleClick?.(circle.num)}
            />
          );
        })}

        {/* Numbers inside circles */}
        {CIRCLES.map((circle, i) => {
          const pos = POSITIONS[i];
          return (
            <text
              key={`n${circle.num}`}
              x={pos.cx}
              y={pos.cy + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#fff"
              fontSize="8"
              fontWeight="700"
              fontFamily="var(--font-display, system-ui)"
              style={{ pointerEvents: "none" }}
            >
              {circle.num}
            </text>
          );
        })}

        {/* Labels outside circles */}
        {LABELS.map((label, i) => (
          <text
            key={`l${i}`}
            x={label.x}
            y={label.y}
            textAnchor={label.anchor}
            dominantBaseline="middle"
            fill="var(--text-primary, #111827)"
            fontSize="5.5"
            fontWeight="600"
            fontFamily="var(--font-display, system-ui)"
            style={{ pointerEvents: "none" }}
          >
            {label.text}
          </text>
        ))}
      </svg>
    </div>
  );
}
