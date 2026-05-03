"use client";

import { useState, useEffect, useRef } from "react";
import { generateStudentCard, type GenerateCardResult } from "./card-actions";
import ForceLightMode from "@/components/ui/ForceLightMode";

interface Props {
  sessionId: string;
  groupNumber: number | null;
  groupRevealed: boolean;
  studentFirstName: string;
}

type Phase = "loading" | "timeout" | "error" | "reveal";

const INSIGHT_LABELS = [
  { key: "wish", label: "THE WISH" },
  { key: "mind", label: "THE MIND" },
  { key: "lens", label: "THE LENS" },
  { key: "scale", label: "THE SCALE" },
  { key: "voice", label: "THE VOICE" },
] as const;

export default function ArchetypeCardReveal({ sessionId, groupNumber, groupRevealed, studentFirstName }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [card, setCard] = useState<GenerateCardResult["card"]>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [animStep, setAnimStep] = useState(-1); // -1 = not animating yet
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only sync from browser API
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchCard() {
      // Start 20s timeout
      timeoutRef.current = setTimeout(() => {
        if (!cancelled) setPhase("timeout");
      }, 20_000);

      try {
        const result = await generateStudentCard(sessionId);

        if (cancelled) return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (result.card) {
          setCard(result.card);
          setPhase("reveal");
          // Skip animation for prefers-reduced-motion, show everything immediately
          if (prefersReducedMotion) {
            setAnimStep(10);
          } else {
            requestAnimationFrame(() => setAnimStep(0));
          }
        } else {
          setPhase("error");
        }
      } catch {
        if (!cancelled && timeoutRef.current) clearTimeout(timeoutRef.current);
        if (!cancelled) setPhase("error");
      }
    }

    fetchCard();
    return () => { cancelled = true; if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [sessionId, retryCount, prefersReducedMotion]);

  // Animation stepper
  useEffect(() => {
    if (animStep < 0 || animStep >= 10) return;
    const delays = [0, 150, 300, 550, 750, 1000, 1150, 1300, 1450, 1600];
    const nextDelay = (delays[animStep + 1] ?? 1850) - (delays[animStep] ?? 0);
    const timer = setTimeout(() => setAnimStep((s) => s + 1), nextDelay);
    return () => clearTimeout(timer);
  }, [animStep]);

  function handleRetry() {
    setPhase("loading");
    setRetryCount((c) => c + 1);
  }

  function handleCopyLink() {
    if (!card) return;
    const url = `${window.location.origin}/c/${card.shareable_slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownloadPDF() {
    if (!card) return;
    const titleSlug = card.title.replace(/^The\s+/i, "").toLowerCase().replace(/\s+/g, "-");
    const nameSlug = studentFirstName.toLowerCase().replace(/\s+/g, "-");
    window.open(`/invention/card-print?session=${sessionId}&filename=${nameSlug}-${titleSlug}.pdf`, "_blank");
  }

  // Style helpers for animation
  const show = (step: number) => animStep >= step;
  const fadeUp = (step: number, translateY = 8) => ({
    opacity: show(step) ? 1 : 0,
    transform: show(step) ? "translateY(0)" : `translateY(${translateY}px)`,
    transition: "opacity 250ms ease-out, transform 300ms ease-out",
  });
  const slideLeft = (step: number) => ({
    opacity: show(step) ? 1 : 0,
    transform: show(step) ? "translateX(0)" : "translateX(-12px)",
    transition: "opacity 200ms ease-out, transform 200ms ease-out",
  });

  return (
    <main className="min-h-screen bg-[var(--bg)] px-6 py-16">
      <ForceLightMode />
      <div className="mx-auto max-w-[520px]">

        {/* ── LOADING STATE ── */}
        {phase === "loading" && (
          <div
            className="rounded-xl mx-auto"
            style={{
              maxWidth: "480px",
              background: "#F0F0EC",
              padding: "32px",
              animation: "cardPulse 1.5s ease-in-out infinite",
              minHeight: "400px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p style={{ fontSize: "13px", color: "#999", textAlign: "center" }}>Finding your type...</p>
          </div>
        )}

        {/* ── TIMEOUT STATE ── */}
        {phase === "timeout" && (
          <div className="rounded-xl mx-auto p-8 text-center" style={{ maxWidth: "480px", background: "#FAFAF8", border: "1px solid #E5E5E5" }}>
            <p style={{ fontSize: "15px", color: "#444", lineHeight: 1.6 }}>
              Your card is still being prepared — this can take a moment when many students finish at the same time.
            </p>
            <p className="mt-4" style={{ fontSize: "14px", color: "#666", lineHeight: 1.6 }}>
              Hold tight — your card will be ready in just a moment.
            </p>
          </div>
        )}

        {/* ── ERROR STATE ── */}
        {phase === "error" && (
          <div className="rounded-xl mx-auto p-8 text-center" style={{ maxWidth: "480px", background: "#FAFAF8", border: "1px solid #E5E5E5" }}>
            <p style={{ fontSize: "15px", color: "#444", lineHeight: 1.6 }}>
              Something went wrong preparing your card.
            </p>
            {retryCount < 1 ? (
              <button
                onClick={handleRetry}
                className="mt-6 rounded-lg border border-[var(--border-strong)] px-6 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
              >
                Try again
              </button>
            ) : (
              <p className="mt-4" style={{ fontSize: "14px", color: "#666", lineHeight: 1.6 }}>
                Please let your facilitator know. Your answers have been saved.
              </p>
            )}
          </div>
        )}

        {/* ── REVEAL CARD ── */}
        {phase === "reveal" && card && (
          <>
            <div
              className="rounded-xl mx-auto"
              style={{
                maxWidth: "480px",
                background: show(0) ? "#FAFAF8" : "#F0F0EC",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                padding: "32px",
                transition: "background 400ms ease-out",
              }}
            >
              {/* THE label */}
              <p
                style={{
                  fontSize: "10px",
                  color: "#999",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  ...fadeUp(1),
                }}
              >
                THE
              </p>

              {/* Title */}
              <h1
                className="font-[family-name:var(--font-serif)]"
                style={{
                  fontSize: "34px",
                  fontWeight: 700,
                  color: "#111",
                  marginTop: "4px",
                  ...fadeUp(2),
                }}
              >
                {card.title.replace(/^The\s+/i, "")}
              </h1>

              {/* Description */}
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#444",
                  lineHeight: 1.6,
                  marginTop: "16px",
                  ...fadeUp(3),
                }}
              >
                {card.description}
              </p>

              {/* Divider */}
              <div
                style={{
                  marginTop: "20px",
                  marginBottom: "20px",
                  height: "1px",
                  background: "#E5E5E5",
                  transformOrigin: "left",
                  transform: show(4) ? "scaleX(1)" : "scaleX(0)",
                  transition: "transform 350ms ease-out",
                }}
              />

              {/* Insight rows */}
              <div className="space-y-4 md:space-y-3">
                {INSIGHT_LABELS.map((insight, i) => (
                  <div
                    key={insight.key}
                    className="flex flex-col md:flex-row md:items-start md:gap-4"
                    style={slideLeft(5 + i)}
                  >
                    <span
                      className="shrink-0"
                      style={{
                        fontSize: "9px",
                        color: "#999",
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.12em",
                        width: "90px",
                        paddingTop: "3px",
                      }}
                    >
                      {insight.label}
                    </span>
                    <span
                      className="mt-1.5 md:mt-0"
                      style={{
                        fontSize: "13px",
                        color: "#222",
                        lineHeight: 1.5,
                      }}
                    >
                      {card.insights[insight.key as keyof typeof card.insights]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action area */}
            <div
              className="mx-auto mt-6 flex flex-col items-center gap-3"
              style={{
                maxWidth: "480px",
                opacity: animStep >= 10 ? 1 : 0,
                transition: "opacity 250ms ease-out",
              }}
            >
              <button
                onClick={handleDownloadPDF}
                className="rounded-lg border border-[var(--border-strong)] px-6 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
              >
                Save Your Card
              </button>
              <button
                onClick={handleCopyLink}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {copied ? "Link copied!" : "Share Your Card"}
              </button>

              {/* Group number pill */}
              {groupRevealed && groupNumber && (
                <div
                  className="mt-2 rounded-full px-4 py-1.5 text-sm font-medium text-white"
                  style={{ background: "#0D9488" }}
                >
                  You are in Group {groupNumber}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes cardPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @media (max-width: 480px) {
          .card-insight-label {
            font-size: 8px !important;
            color: #BBBBBB !important;
          }
        }
      `}</style>
    </main>
  );
}
