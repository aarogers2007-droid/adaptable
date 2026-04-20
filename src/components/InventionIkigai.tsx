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

// ViewBox 300x300. Big circles (R=50), tight pentagon, edges kissing.
const POSITIONS = [
  { cx: 150, cy: 58 },   // 1: top center
  { cx: 62, cy: 118 },   // 2: upper-left
  { cx: 238, cy: 118 },  // 3: upper-right
  { cx: 88, cy: 218 },   // 4: lower-left
  { cx: 212, cy: 218 },  // 5: lower-right
];

const R = 50;

export default function InventionIkigai({
  currentCircle = 0,
  completedCircles = [],
  onCircleClick,
}: InventionIkigaiProps) {
  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: "500px" }}>
      <svg viewBox="0 0 300 280" className="w-full h-auto" style={{ overflow: "visible" }}>
        {CIRCLES.map((circle, i) => {
          const pos = POSITIONS[i];
          const isActive = currentCircle === circle.num;
          const isCompleted = completedCircles.includes(circle.num);
          const isClickable = !!onCircleClick && !isActive;

          const fillOpacity = isActive ? 0.4 : isCompleted ? 0.3 : 0.2;
          const strokeWidth = isActive ? 4 : 2.5;
          const strokeOpacity = 1;

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
                y={pos.cy - 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#111827"
                fontSize="22"
                fontWeight="700"
                fontFamily="var(--font-display, system-ui)"
                style={{ pointerEvents: "none" }}
              >
                {circle.num}
              </text>

              {/* Name */}
              <text
                x={pos.cx}
                y={pos.cy + 14}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#111827"
                fontSize="13"
                fontWeight="500"
                fontFamily="var(--font-display, system-ui)"
                style={{ pointerEvents: "none" }}
              >
                {circle.name}
              </text>

            </g>
          );
        })}
      </svg>
    </div>
  );
}
