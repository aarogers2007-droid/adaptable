"use client";

import { useState, useEffect } from "react";

interface CharacterIntroProps {
  name: string;
  creature: string;
  domain: string;
  domainColor: string;
  openingLine: string;
  imageUrl?: string | null;
  onContinue: () => void;
}

export default function CharacterIntro({
  name,
  creature,
  domain,
  domainColor,
  openingLine,
  imageUrl,
  onContinue,
}: CharacterIntroProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation on mount
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="mx-4 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-2xl overflow-hidden transition-all duration-400 ease-out"
        style={{
          transform: visible ? "scale(1)" : "scale(0.9)",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Gradient accent bar */}
        <div
          className="h-2"
          style={{
            background: `linear-gradient(90deg, ${domainColor}, ${domainColor}88)`,
          }}
        />

        <div className="px-8 py-8 text-center">
          {/* Avatar */}
          <div className="mx-auto mb-4 flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ backgroundColor: domainColor }}
              >
                {name.charAt(0)}
              </div>
            )}
          </div>

          {/* Name */}
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
            {name}
          </h2>

          {/* Creature subtitle */}
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            The {creature}
          </p>

          {/* Domain label */}
          <span
            className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: domainColor }}
          >
            {domain} Guide
          </span>

          {/* Opening line */}
          <blockquote className="mt-6 text-sm italic leading-relaxed text-[var(--text-secondary)]">
            &ldquo;{openingLine}&rdquo;
          </blockquote>

          {/* Continue button */}
          <button
            onClick={onContinue}
            className="mt-6 w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: domainColor }}
          >
            Let&apos;s go
          </button>
        </div>
      </div>
    </div>
  );
}
