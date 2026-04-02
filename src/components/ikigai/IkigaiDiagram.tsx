"use client";

import { useState } from "react";

export type IkigaiStep = 1 | 2 | 3 | 4;

interface StepConfig {
  id: IkigaiStep;
  label: string;
  question: string;
  color: string;
  position: { cx: number; cy: number };
}

const STEPS: StepConfig[] = [
  {
    id: 1,
    label: "What you love",
    question: "What activities make you lose track of time? What topics could you talk about for hours?",
    color: "var(--ikigai-love)",
    position: { cx: 50, cy: 25 },
  },
  {
    id: 2,
    label: "What you're good at",
    question: "What skills do you have that others find valuable? What do people come to you for help with?",
    color: "var(--ikigai-skills)",
    position: { cx: 25, cy: 55 },
  },
  {
    id: 3,
    label: "What the world needs",
    question: "What problems do you see around you that need solving? What frustrates people in your community?",
    color: "var(--ikigai-needs)",
    position: { cx: 75, cy: 55 },
  },
  {
    id: 4,
    label: "What you can be paid for",
    question: "What would someone actually pay for? What services or products could you sell?",
    color: "var(--ikigai-money)",
    position: { cx: 50, cy: 80 },
  },
];

interface IkigaiDiagramProps {
  completedSteps: Set<number>;
  onStepClick: (step: IkigaiStep) => void;
  showReveal: boolean;
  businessName?: string;
}

export default function IkigaiDiagram({
  completedSteps,
  onStepClick,
  showReveal,
  businessName,
}: IkigaiDiagramProps) {
  const [hoveredStep, setHoveredStep] = useState<IkigaiStep | null>(null);

  return (
    <div className="relative mx-auto" style={{ width: 500, height: 500 }}>
      {STEPS.map((step) => {
        const isCompleted = completedSteps.has(step.id);
        const isHovered = hoveredStep === step.id;

        return (
          <button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            onMouseEnter={() => setHoveredStep(step.id)}
            onMouseLeave={() => setHoveredStep(null)}
            aria-label={`Step ${step.id} of 4: ${step.label}${isCompleted ? " (completed)" : ""}`}
            className="absolute rounded-full flex items-center justify-center cursor-pointer"
            style={{
              width: isHovered ? 235 : 220,
              height: isHovered ? 235 : 220,
              left: `${step.position.cx}%`,
              top: `${step.position.cy}%`,
              transform: "translate(-50%, -50%)",
              backgroundColor: step.color,
              opacity: isCompleted ? 0.6 : isHovered ? 0.55 : 0.4,
              transition: "all 300ms ease-out",
            }}
          >
            <span className="font-[family-name:var(--font-display)] font-semibold text-sm text-[var(--text-primary)] select-none pointer-events-none">
              {isCompleted && <span className="mr-1.5">&#10003;</span>}
              {step.label}
            </span>
          </button>
        );
      })}

      {/* Center */}
      <div
        className="absolute rounded-full flex items-center justify-center pointer-events-none"
        style={{
          width: showReveal ? 320 : 70,
          height: showReveal ? 320 : 70,
          left: "50%",
          top: "52.5%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, var(--ikigai-center-inner) 40%, var(--ikigai-center-outer) 100%)",
          boxShadow: showReveal
            ? "0 0 80px rgba(74, 103, 65, 0.5)"
            : "0 0 20px rgba(74, 103, 65, 0.2)",
          transition: "all 700ms ease-out",
          zIndex: showReveal ? 20 : 5,
        }}
      >
        {showReveal && businessName ? (
          <div className="text-center px-8">
            <p className="text-xs text-white/70 font-medium uppercase tracking-wider">
              Your Business
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-white">
              {businessName}
            </p>
          </div>
        ) : (
          <span className="font-[family-name:var(--font-display)] text-xs font-bold text-white/90">
            IKIGAI
          </span>
        )}
      </div>
    </div>
  );
}

export { STEPS };
export type { StepConfig };
