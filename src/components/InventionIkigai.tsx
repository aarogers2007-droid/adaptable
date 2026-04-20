"use client";

/**
 * Invention Ikigai — five circles in a pentagon arrangement.
 * Edges touch but don't overlap. Each circle is clickable when onCircleClick is provided.
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

// Handcrafted positions in a 200×200 viewBox for clean rendering.
// Pentagon pointing up, circles R=28, edges touching.
const POSITIONS = [
  { cx: 100, cy: 32 },   // 1: top center
  { cx: 38, cy: 62 },    // 2: upper-left
  { cx: 162, cy: 62 },   // 3: upper-right
  { cx: 55, cy: 132 },   // 4: lower-left
  { cx: 145, cy: 132 },  // 5: lower-right
];

const R = 28;

export default function InventionIkigai({
  currentCircle = 0,
  completedCircles = [],
  onCircleClick,
}: InventionIkigaiProps) {
  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: "420px" }}>
      <svg viewBox="0 0 200 170" className="w-full h-auto" style={{ overflow: "visible" }}>
        {CIRCLES.map((circle, i) => {
          const pos = POSITIONS[i];
          const isActive = currentCircle === circle.num;
          const isCompleted = completedCircles.includes(circle.num);
          const isClickable = !!onCircleClick && !isActive;

          const fillOpacity = isActive ? 0.35 : isCompleted ? 0.2 : 0.12;
          const strokeWidth = isActive ? 3 : 2;
          const strokeOpacity = isActive ? 1 : isCompleted ? 0.8 : 0.4;

          return (
            <g
              key={circle.num}
              style={{ cursor: isClickable ? "pointer" : "default" }}
              onClick={() => isClickable && onCircleClick?.(circle.num)}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={(e) => {
                if (isClickable && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onCircleClick?.(circle.num);
                }
              }}
            >
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r={R}
                fill={circle.color}
                fillOpacity={fillOpacity}
                stroke={circle.color}
                strokeWidth={strokeWidth}
                strokeOpacity={strokeOpacity}
                style={{
                  transition: "fill-opacity 0.3s, stroke-width 0.3s, stroke-opacity 0.3s",
                  filter: isActive ? `drop-shadow(0 0 8px ${circle.color}60)` : "none",
                }}
              />

              {/* Number */}
              <text
                x={pos.cx}
                y={pos.cy - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isCompleted || isActive ? "#F9FAFB" : "#9CA3AF"}
                fontSize="12"
                fontWeight="700"
                fontFamily="var(--font-display, system-ui)"
                style={{ transition: "fill 0.3s", pointerEvents: "none" }}
              >
                {circle.num}
              </text>

              {/* Name */}
              <text
                x={pos.cx}
                y={pos.cy + 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isCompleted || isActive ? "#E5E7EB" : "#6B7280"}
                fontSize="7.5"
                fontWeight="400"
                fontFamily="var(--font-display, system-ui)"
                style={{ transition: "fill 0.3s", pointerEvents: "none" }}
              >
                {circle.name}
              </text>

              {/* Completed dot */}
              {isCompleted && !isActive && (
                <circle
                  cx={pos.cx + R * 0.55}
                  cy={pos.cy - R * 0.55}
                  r="4"
                  fill={circle.color}
                  stroke="#111827"
                  strokeWidth="1.5"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
