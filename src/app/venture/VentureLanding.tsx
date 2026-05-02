"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import InventionIkigai from "@/components/InventionIkigai";

interface Props {
  isAuthenticated: boolean;
  isEnrolled: boolean;
}

export default function VentureLanding({ isAuthenticated, isEnrolled }: Props) {
  const router = useRouter();

  // Public page — always light mode
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    return () => { if (localStorage.getItem("theme") === "dark") document.documentElement.classList.add("dark"); };
  }, []);

  function handleBegin() {
    if (isEnrolled) {
      router.push("/invention");
    } else {
      // Store VENTURE as pending join, then go to signup
      sessionStorage.setItem("pendingInviteCode", "VENTURE");
      sessionStorage.setItem("pendingClassJoin", JSON.stringify({ sessionType: "invention" }));
      router.push(isAuthenticated ? "/join" : "/signup");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16" style={{ background: "#ffffff" }}>
      <div className="text-center max-w-[600px]">
        {/* Event title */}
        <p
          className="font-[family-name:var(--font-display)]"
          style={{ fontSize: "13px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#7C3AED" }}
        >
          VentureLab
        </p>
        <h1
          className="mt-3 font-[family-name:var(--font-display)] font-bold"
          style={{ fontSize: "34px", lineHeight: 1.3, color: "#111827" }}
        >
          Invention Mode
        </h1>
        <p className="mt-2" style={{ fontSize: "16px", color: "#6B7280" }}>
          May 13, 2026
        </p>

        {/* Pentagon diagram */}
        <div className="mt-10 mx-auto" style={{ maxWidth: "360px" }}>
          <InventionIkigai />
        </div>

        {/* Instructions */}
        <p className="mt-8" style={{ fontSize: "16px", lineHeight: 1.618, color: "#4B5563" }}>
          Click on each circle and answer the questions honestly.
        </p>

        {/* Begin button */}
        <button
          onClick={handleBegin}
          className="mt-8 rounded-lg px-10 py-4 font-semibold text-white transition-colors hover:brightness-110"
          style={{
            fontSize: "16px",
            background: "#7C3AED",
            boxShadow: "0 0 21px rgba(124, 58, 237, 0.3), 0 0 55px rgba(124, 58, 237, 0.1)",
          }}
        >
          Begin
        </button>

        <p className="mt-6" style={{ fontSize: "12px", color: "#9CA3AF" }}>
          You&apos;ll create an account to save your answers.
        </p>
      </div>
    </main>
  );
}
