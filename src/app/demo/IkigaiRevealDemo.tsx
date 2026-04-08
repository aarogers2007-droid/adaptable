"use client";

import { useEffect, useState } from "react";

interface IkigaiRevealDemoProps {
  studentFirstName: string;
  businessName: string;
  businessNiche: string;
  whyThisFits: string;
  revenueModel: string;
  onClose: () => void;
}

/**
 * Standalone preview of the Ikigai wizard's "ignited" reveal card.
 * Same DOM/CSS classes as the real wizard's reveal in IkigaiWizard.tsx
 * (creation flash, multi-layer breathing glow, gradient bar wash, spark
 * embers from all edges, business name + "Why this fits"). Plays for ~8s
 * then auto-closes. Used by /demo for testers to see what the wizard
 * reveal looks like without going through the wizard.
 */
export default function IkigaiRevealDemo({
  studentFirstName,
  businessName,
  businessNiche,
  whyThisFits,
  revenueModel,
  onClose,
}: IkigaiRevealDemoProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Match the wizard's "card → ready" timing: card materializes, breathes,
    // then we let the user dismiss or auto-close after a generous beat.
    const enter = setTimeout(() => setVisible(true), 60);
    const auto = setTimeout(() => onClose(), 9500);
    return () => {
      clearTimeout(enter);
      clearTimeout(auto);
    };
  }, [onClose]);

  // Aura particles — sparks from all edges. Generated once at mount so the
  // random positions stay stable across re-renders.
  const [particles] = useState(() =>
    Array.from({ length: 32 }).map((_, i) => {
      const colors = ["#F5E642", "#A8DB5A", "#F4A79D", "#6DD5D0"];
      const color = colors[i % 4];
      const size = 4 + Math.random() * 5;
      const edge = i % 4;
      const pos =
        edge === 0
          ? { left: `${-3 + Math.random() * 6}%`, top: `${5 + Math.random() * 90}%` }
          : edge === 1
          ? { left: `${97 + Math.random() * 6}%`, top: `${5 + Math.random() * 90}%` }
          : edge === 2
          ? { left: `${10 + Math.random() * 80}%`, top: `${-3 + Math.random() * 6}%` }
          : { left: `${10 + Math.random() * 80}%`, top: `${97 + Math.random() * 6}%` };
      return {
        key: i,
        color,
        size,
        ...pos,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 2.618,
      };
    })
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg-subtle)]/95 backdrop-blur-sm px-4"
      onClick={onClose}
      role="dialog"
      aria-label="Ikigai reveal preview"
    >
      <div
        className="relative w-full"
        style={{
          maxWidth: "420px",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          transition: "all 600ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="ikigai-reveal-card rounded-xl bg-[var(--bg)] border border-[var(--border)]"
          style={{ position: "relative", overflow: "visible" }}
        >
          {/* Three breathing glow shells */}
          <div className="ikigai-reveal-glow ikigai-reveal-glow-outer" />
          <div className="ikigai-reveal-glow ikigai-reveal-glow-mid" />
          <div className="ikigai-reveal-glow ikigai-reveal-glow-inner" />

          {/* Gradient bar glow + warm wash */}
          <div className="ikigai-reveal-bar-glow" />
          <div className="ikigai-reveal-gradient-wash" />

          {/* Aura particles — sparks from all edges */}
          <div className="ikigai-reveal-particles">
            {particles.map((p) => (
              <div
                key={p.key}
                className="ikigai-reveal-particle"
                style={{
                  left: p.left,
                  top: p.top,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}66, 0 0 ${p.size * 4}px ${p.color}33`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                }}
              />
            ))}
          </div>

          {/* Ikigai gradient bar */}
          <div
            className="flex h-1.5"
            style={{
              position: "relative",
              zIndex: 2,
              borderRadius: "12px 12px 0 0",
              overflow: "hidden",
            }}
          >
            <div className="flex-1" style={{ backgroundColor: "var(--ikigai-love)" }} />
            <div className="flex-1" style={{ backgroundColor: "var(--ikigai-skills)" }} />
            <div className="flex-1" style={{ backgroundColor: "var(--ikigai-needs)" }} />
            <div className="flex-1" style={{ backgroundColor: "var(--ikigai-money)" }} />
          </div>

          <div className="p-6 text-left" style={{ position: "relative", zIndex: 2 }}>
            <p className="text-sm font-medium text-[var(--text-muted)] tracking-wide">
              {studentFirstName}&apos;s venture
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-[32px] font-bold leading-tight text-[var(--text-primary)]">
              {businessName}
            </h2>
            <p className="mt-2 text-base text-[var(--text-secondary)]">{businessNiche}</p>

            <div className="mt-5 pt-5 border-t border-[var(--border)]">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Why this fits you
              </p>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed">{whyThisFits}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                How you earn
              </p>
              <p className="text-sm text-[var(--text-secondary)]">{revenueModel}</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 mx-auto block rounded-full border border-[var(--border-strong)] bg-[var(--bg)] px-5 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
