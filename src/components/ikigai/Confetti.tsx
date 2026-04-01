"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  velocity: number;
  rotation: number;
  rotationSpeed: number;
}

const COLORS = [
  "var(--ikigai-love)",
  "var(--ikigai-skills)",
  "var(--ikigai-needs)",
  "var(--ikigai-money)",
  "var(--accent)",
  "var(--primary)",
];

export default function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;

    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: 50,
      y: 50,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 6,
      angle: Math.random() * Math.PI * 2,
      velocity: 2 + Math.random() * 6,
      rotation: Math.random() * 360,
      rotationSpeed: -3 + Math.random() * 6,
    }));

    setParticles(newParticles);

    const timeout = setTimeout(() => setParticles([]), 2000);
    return () => clearTimeout(timeout);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 30 }}
      aria-hidden="true"
    >
      {particles.map((p) => {
        const endX = p.x + Math.cos(p.angle) * p.velocity * 15;
        const endY = p.y + Math.sin(p.angle) * p.velocity * 15;

        return (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: p.color,
              borderRadius: 1,
              transform: `rotate(${p.rotation}deg)`,
              animation: `confetti-fly 700ms ease-out forwards`,
              "--end-x": `${endX - p.x}vw`,
              "--end-y": `${endY - p.y}vh`,
              "--end-rotation": `${p.rotation + p.rotationSpeed * 100}deg`,
            } as React.CSSProperties}
          />
        );
      })}
      <style>{`
        @keyframes confetti-fly {
          0% {
            transform: translate(0, 0) rotate(var(--end-rotation, 0deg));
            opacity: 1;
          }
          100% {
            transform: translate(var(--end-x, 0), var(--end-y, 0)) rotate(var(--end-rotation, 360deg));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
