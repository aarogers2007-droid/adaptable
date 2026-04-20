"use client";

interface InventionIkigaiProps {
  currentCircle?: number;
  completedCircles?: number[];
  onCircleClick?: (circle: number) => void;
}

const CIRCLES = [
  { num: 1, color: "#C084FC" },
  { num: 2, color: "#60A5FA" },
  { num: 3, color: "#2DD4BF" },
  { num: 4, color: "#FBBF24" },
  { num: 5, color: "#F87171" },
];

// r=15. Side of pentagon = 30 (exactly 2r, borders kiss, ZERO overlap).
// Inscribing radius = 30 / (2 * sin(36°)) = 25.52
// Center (50, 48). Angles reordered: top, upper-left, upper-right, lower-left, lower-right.
const R = 15;
const S = 25.52;
const CX = 50;
const CY = 48;
// Clockwise from top: 1=top, 2=upper-right, 3=lower-right, 4=lower-left, 5=upper-left
const POS = [
  { cx: CX, cy: CY - S },                                                          // 1: top
  { cx: CX + S * Math.cos(-18 * Math.PI / 180), cy: CY + S * Math.sin(-18 * Math.PI / 180) }, // 2: upper-right
  { cx: CX + S * Math.cos(54 * Math.PI / 180), cy: CY + S * Math.sin(54 * Math.PI / 180) },   // 3: lower-right
  { cx: CX + S * Math.cos(126 * Math.PI / 180), cy: CY + S * Math.sin(126 * Math.PI / 180) }, // 4: lower-left
  { cx: CX + S * Math.cos(198 * Math.PI / 180), cy: CY + S * Math.sin(198 * Math.PI / 180) }, // 5: upper-left
];

export default function InventionIkigai({
  currentCircle = 0,
  completedCircles = [],
  onCircleClick,
}: InventionIkigaiProps) {
  return (
    <div className="relative mx-auto w-full max-w-[480px]" style={{ aspectRatio: "1 / 1" }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        {CIRCLES.map((circle, i) => {
          const pos = POS[i];
          const isActive = currentCircle === circle.num;
          const isClickable = !!onCircleClick && !isActive;

          return (
            <g key={circle.num}>
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r={R}
                fill={circle.color}
                fillOpacity={isActive ? 0.35 : 0.2}
                stroke={circle.color}
                strokeWidth={isActive ? 2.5 : 2}
                style={{
                  cursor: isClickable ? "pointer" : "default",
                  filter: isActive ? `drop-shadow(0 0 4px ${circle.color})` : "none",
                }}
                onClick={() => isClickable && onCircleClick?.(circle.num)}
              />
              <text
                x={pos.cx}
                y={pos.cy + 0.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#111827"
                fontSize="10"
                fontWeight="800"
                fontFamily="var(--font-display, system-ui)"
                style={{ pointerEvents: "none" }}
              >
                {circle.num}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
