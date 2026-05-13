"use client";

import { useState } from "react";
import { submitRating } from "@/app/(app)/rating/actions";

interface Props {
  contextType: "lesson" | "scenario" | "guide";
  contextId?: string;
}

function Star({ filled, onHover, onClick }: { filled: boolean; onHover: () => void; onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onClick={onClick}
      className="p-0 border-0 bg-transparent cursor-pointer transition-colors"
      aria-label="Rate"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "var(--primary)" : "none"} stroke={filled ? "var(--primary)" : "var(--text-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
}

/**
 * Small star rating widget for chat interfaces.
 * Shows "How's Adaptable doing?" + 5 stars.
 * Disappears immediately on click (optimistic submission).
 */
export default function RatingWidget({ contextType, contextId }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  if (submitted) return null;

  function handleClick(star: number) {
    setSubmitted(true);
    submitRating(contextType, contextId, star);
  }

  return (
    <div
      className="flex items-center gap-1.5"
      onMouseLeave={() => setHovered(null)}
    >
      <span className="text-[9px] text-[var(--text-muted)] mr-0.5">How&apos;s Adaptable doing?</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          filled={hovered !== null ? star <= hovered : false}
          onHover={() => setHovered(star)}
          onClick={() => handleClick(star)}
        />
      ))}
    </div>
  );
}
