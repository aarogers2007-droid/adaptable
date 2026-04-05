"use client";

import { useState, useEffect } from "react";

interface WelcomeCinematicProps {
  businessName: string;
  studentName: string;
  children: React.ReactNode;
}

export default function WelcomeCinematic({
  businessName,
  studentName,
  children,
}: WelcomeCinematicProps) {
  const [phase, setPhase] = useState<"bloom" | "name" | "fade" | "done">("bloom");

  useEffect(() => {
    // Check if already seen this session
    if (sessionStorage.getItem("welcome-seen")) {
      setPhase("done");
      return;
    }

    const timers = [
      setTimeout(() => setPhase("name"), 1800),
      setTimeout(() => setPhase("fade"), 4000),
      setTimeout(() => {
        setPhase("done");
        sessionStorage.setItem("welcome-seen", "1");
      }, 4800),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  if (phase === "done") {
    return <>{children}</>;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#0a0a0c" }}
    >
      {/* Ikigai color blooms */}
      <div
        className="absolute"
        style={{
          width: "600px",
          height: "600px",
          transition: "opacity 0.8s ease-out",
          opacity: phase === "fade" ? 0 : 1,
        }}
      >
        {/* Love — yellow, top-left */}
        <div
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,230,66,0.6) 0%, rgba(245,230,66,0) 70%)",
            top: "0",
            left: "50px",
            animation: "ikigaiBloom 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            animationDelay: "0s",
            opacity: 0,
            transform: "scale(0)",
          }}
        />
        {/* Skills — green, top-right */}
        <div
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,219,90,0.6) 0%, rgba(168,219,90,0) 70%)",
            top: "0",
            right: "50px",
            animation: "ikigaiBloom 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            animationDelay: "0.3s",
            opacity: 0,
            transform: "scale(0)",
          }}
        />
        {/* Needs — pink, bottom-left */}
        <div
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(244,167,157,0.6) 0%, rgba(244,167,157,0) 70%)",
            bottom: "0",
            left: "50px",
            animation: "ikigaiBloom 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            animationDelay: "0.6s",
            opacity: 0,
            transform: "scale(0)",
          }}
        />
        {/* Money — teal, bottom-right */}
        <div
          style={{
            position: "absolute",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(109,213,208,0.6) 0%, rgba(109,213,208,0) 70%)",
            bottom: "0",
            right: "50px",
            animation: "ikigaiBloom 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            animationDelay: "0.9s",
            opacity: 0,
            transform: "scale(0)",
          }}
        />
      </div>

      {/* Center content — business name + student name */}
      <div
        className="relative z-10 text-center px-6"
        style={{
          opacity: phase === "name" || phase === "fade" ? 1 : 0,
          transform: phase === "name" || phase === "fade" ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
        }}
      >
        <h1
          className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold text-white"
          style={{
            textShadow: "0 0 40px rgba(255,255,255,0.15)",
          }}
        >
          {businessName}
        </h1>
        <p
          className="mt-3 text-lg text-white/60"
          style={{
            opacity: phase === "name" || phase === "fade" ? 1 : 0,
            transition: "opacity 0.6s ease-out 0.3s",
          }}
        >
          Welcome back, {studentName}
        </p>
      </div>

      {/* Fade to dashboard */}
      <div
        className="absolute inset-0 bg-[var(--bg-subtle)] z-20 pointer-events-none"
        style={{
          opacity: phase === "fade" ? 1 : 0,
          transition: "opacity 0.8s ease-in",
        }}
      />

      <style>{`
        @keyframes ikigaiBloom {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.8;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
