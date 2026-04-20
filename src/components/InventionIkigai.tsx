"use client";

/**
 * Pentagon Ikigai Diagram for Invention Mode.
 *
 * Five circles in an upward-pointing pentagon arrangement.
 * Used as:
 *   - Persistent progress/navigation in the invention wizard
 *   - Illustrative centerpiece on the /venture landing page
 *
 * Props:
 *   currentCircle: 1-5 (which circle the student is on, 0 = none/landing)
 *   completedCircles: array of completed circle numbers
 *   onCircleClick: optional — if provided, completed circles are clickable
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

// Pentagon with big circles, edges touching.
// R=20. Adjacent center distance = 40 (exactly 2R = touching).
// Regular pentagon inscribed in a circle of radius 26 from center (50,50).
// Pentagon vertices at angles: -90°, -18°, 54°, 126°, 198° (pointing up).
// PR chosen so side length = 2R = 40 (edges touch exactly)
// side = 2 * PR * sin(π/5) → PR = 40 / (2 * sin(36°)) ≈ 34
const PR = 34;
const CX = 50, CY = 50;
const angles = [-90, -18, 54, 126, 198].map(a => a * Math.PI / 180);
const POSITIONS = angles.map(a => ({
  cx: Math.round((CX + PR * Math.cos(a)) * 10) / 10,
  cy: Math.round((CY + PR * Math.sin(a)) * 10) / 10,
}));
// Computed: (50,22), (74.7,39.9), (65.3,69.1), (34.7,69.1), (25.3,39.9)

const R = 20;

export default function InventionIkigai({
  currentCircle = 0,
  completedCircles = [],
  onCircleClick,
}: InventionIkigaiProps) {
  return (
    <div
      className="relative mx-auto w-full"
      style={{ maxWidth: "520px", aspectRatio: "1 / 1" }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ overflow: "visible" }}
      >
        {/* Render circles */}
        {CIRCLES.map((circle, i) => {
          const pos = POSITIONS[i];
          const isActive = currentCircle === circle.num;
          const isCompleted = completedCircles.includes(circle.num);
          const isReachable = isCompleted || isActive;
          const isClickable = !!onCircleClick && !isActive;

          const fillOpacity = isActive ? 0.35 : isCompleted ? 0.2 : 0.12;
          const strokeWidth = isActive ? 2.5 : 2;
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
              {/* Circle fill */}
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
                  filter: isActive ? `drop-shadow(0 0 6px ${circle.color}50)` : "none",
                }}
              />

              {/* Number */}
              <text
                x={pos.cx}
                y={pos.cy - 4}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isReachable ? "#F9FAFB" : "#9CA3AF"}
                fontSize="7"
                fontWeight="700"
                fontFamily="var(--font-display, system-ui)"
                style={{ transition: "fill 0.3s" }}
              >
                {circle.num}
              </text>

              {/* Name */}
              <text
                x={pos.cx}
                y={pos.cy + 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isReachable ? "#E5E7EB" : "#6B7280"}
                fontSize="4.5"
                fontWeight="400"
                fontFamily="var(--font-display, system-ui)"
                style={{ transition: "fill 0.3s" }}
              >
                {circle.name}
              </text>

              {/* Completed indicator — small filled dot */}
              {isCompleted && !isActive && (
                <circle
                  cx={pos.cx + R * 0.55}
                  cy={pos.cy - R * 0.55}
                  r="2"
                  fill={circle.color}
                  stroke="#111827"
                  strokeWidth="0.8"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
