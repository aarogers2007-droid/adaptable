"use client";

/**
 * Invention Ikigai — five circles in a pentagon.
 * Borders TOUCH. No overlap. No gap.
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

// r=16. Pentagon side = 2r = 32 (borders touch exactly).
// Pentagon inscribing radius = side / (2 * sin(π/5)) = 32 / 1.176 = 27.2
// Center at (50, 52) to vertically center in viewBox.
// Angles: -90° (top), -18° (upper-right), 54° (lower-right), 126° (lower-left), 198° (upper-left)
const R = 16;
const PR = 27.2;
const CX = 50;
const CY = 52;
const POSITIONS = [
  { cx: CX + PR * Math.cos(-90 * Math.PI / 180), cy: CY + PR * Math.sin(-90 * Math.PI / 180) },   // top
  { cx: CX + PR * Math.cos(-18 * Math.PI / 180), cy: CY + PR * Math.sin(-18 * Math.PI / 180) },   // upper-right
  { cx: CX + PR * Math.cos(54 * Math.PI / 180), cy: CY + PR * Math.sin(54 * Math.PI / 180) },     // lower-right
  { cx: CX + PR * Math.cos(126 * Math.PI / 180), cy: CY + PR * Math.sin(126 * Math.PI / 180) },   // lower-left
  { cx: CX + PR * Math.cos(198 * Math.PI / 180), cy: CY + PR * Math.sin(198 * Math.PI / 180) },   // upper-left
];
// Reorder to match circle numbering: 1=top, 2=upper-left, 3=upper-right, 4=lower-left, 5=lower-right
const POS = [
  POSITIONS[0], // 1: top
  POSITIONS[4], // 2: upper-left
  POSITIONS[1], // 3: upper-right
  POSITIONS[3], // 4: lower-left
  POSITIONS[2], // 5: lower-right
];

export default function InventionIkigai({
  currentCircle = 0,
  completedCircles = [],
  onCircleClick,
}: InventionIkigaiProps) {
  return (
    <div className="relative mx-auto w-full max-w-[480px]" style={{ aspectRatio: "1 / 1" }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible">
        {CIRCLES.map((circle, i) => {
          const pos = POS[i];
          const isActive = currentCircle === circle.num;
          const isCompleted = completedCircles.includes(circle.num);
          const isClickable = !!onCircleClick && !isActive;

          return (
            <g key={circle.num}>
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r={R}
                fill={circle.color}
                fillOpacity={isActive ? 0.35 : isCompleted ? 0.25 : 0.18}
                stroke={circle.color}
                strokeWidth={isActive ? 2.5 : 2}
                strokeOpacity={1}
                style={{
                  cursor: isClickable ? "pointer" : "default",
                  transition: "fill-opacity 0.3s",
                  filter: isActive ? `drop-shadow(0 0 4px ${circle.color})` : "none",
                }}
                onClick={() => isClickable && onCircleClick?.(circle.num)}
              />
              <text
                x={pos.cx}
                y={pos.cy - 3}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#111827"
                fontSize="6.5"
                fontWeight="700"
                fontFamily="var(--font-display, system-ui)"
                style={{ pointerEvents: "none" }}
              >
                {circle.num}
              </text>
              <text
                x={pos.cx}
                y={pos.cy + 4.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#111827"
                fontSize="3.5"
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
