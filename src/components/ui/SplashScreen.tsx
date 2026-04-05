"use client";

import { useState, useEffect } from "react";

interface SplashScreenProps {
  children: React.ReactNode;
  preview?: boolean;
  onDone?: () => void;
}

/*
 * Letters of "Adaptable" fly in from different directions,
 * assemble into the word, hold, then fade to content.
 */

const LETTERS = [
  { char: "A", x: -120, y: -200, rotate: -25,  delay: 0 },
  { char: "d", x: 60,   y: 250,  rotate: 15,   delay: 0.08 },
  { char: "a", x: 300,  y: -50,  rotate: -10,  delay: 0.16 },
  { char: "p", x: -80,  y: -300, rotate: 20,   delay: 0.24 },
  { char: "t", x: -250, y: 150,  rotate: -18,  delay: 0.32 },
  { char: "a", x: 200,  y: 200,  rotate: 12,   delay: 0.4 },
  { char: "b", x: 280,  y: -180, rotate: -22,  delay: 0.48 },
  { char: "l", x: -200, y: -100, rotate: 30,   delay: 0.56 },
  { char: "e", x: 150,  y: 300,  rotate: -15,  delay: 0.64 },
];

export default function SplashScreen({ children, preview, onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<"scatter" | "assembled" | "fade" | "done">("scatter");

  useEffect(() => {
    if (!preview && sessionStorage.getItem("splash-seen")) {
      setPhase("done");
      return;
    }

    // Kick off assembly after a brief moment
    const t1 = setTimeout(() => setPhase("assembled"), 100);
    // Hold the assembled word
    const t2 = setTimeout(() => setPhase("fade"), 3500);
    // Done
    const t3 = setTimeout(() => {
      setPhase("done");
      if (!preview) sessionStorage.setItem("splash-seen", "1");
      onDone?.();
    }, 4800);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [preview, onDone]);

  if (phase === "done") return <>{children}</>;

  const isAssembled = phase === "assembled" || phase === "fade";
  const isFading = phase === "fade";

  return (
    <>
      <div style={{ display: "none" }}>{children}</div>

      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: "#ffffff",
          opacity: isFading ? 0 : 1,
          transition: isFading ? "opacity 1.3s ease-in-out" : "none",
        }}
      >
        {/* The letters */}
        <div
          className="flex"
          style={{
            fontFamily: "Satoshi, system-ui, sans-serif",
            fontSize: "clamp(48px, 11vw, 88px)",
            fontWeight: 700,
            color: "#1a1a1e",
            letterSpacing: "-0.025em",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {LETTERS.map((letter, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                transform: isAssembled
                  ? "translate(0, 0) rotate(0deg)"
                  : `translate(${letter.x}px, ${letter.y}px) rotate(${letter.rotate}deg)`,
                opacity: isAssembled ? 1 : 0,
                transition: `transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${letter.delay}s, opacity 0.6s ease-out ${letter.delay}s`,
              }}
            >
              {letter.char}
            </span>
          ))}
        </div>
      </div>

      {/* Content fades in */}
      {isFading && (
        <div
          className="fixed inset-0 z-[9998]"
          style={{
            opacity: 0,
            animation: "contentFadeIn 1.3s ease-out 0.5s forwards",
          }}
        >
          {children}
        </div>
      )}

      <style>{`
        @keyframes contentFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
