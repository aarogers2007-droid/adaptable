"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  delay: number;
  color: string;
  size: number;
  duration: number;
}

const COLORS = [
  "var(--ikigai-love)",
  "var(--ikigai-skills)",
  "var(--ikigai-needs)",
  "var(--ikigai-money)",
  "var(--accent)",
  "var(--primary)",
  "var(--ikigai-center-outer)",
];

export default function CompletionConfetti() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const newParticles: Particle[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 8,
      duration: 2 + Math.random() * 3,
    }));

    setParticles(newParticles);

    const timeout = setTimeout(() => setParticles([]), 5000);
    return () => clearTimeout(timeout);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: -20,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: 1,
            animation: `completion-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes completion-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
