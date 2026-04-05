"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Card3DProps {
  businessName: string;
  niche: string;
  studentName: string;
  targetCustomer?: string;
  finish: "matte" | "holographic" | "gold" | "silver" | "chrome";
  accentColor: string | null;
  cardBase: string;
  showBack: boolean;
  backContent: {
    achievements: { name: string; icon: string; tier: string }[];
    stats?: Record<string, string>;
  };
  borderStyle: "clean" | "rounded" | "beveled";
  isFounder: boolean;
  showRotateHint: boolean;
  forceFlipped?: boolean;
  fontFamily?: string;
  large?: boolean;
  onCanvasReady?: (canvas: HTMLCanvasElement | null) => void;
}

interface BaseStyle {
  bg: string;
  text: string;
  subtext: string;
  shadow: string;
}

const BASE_STYLES: Record<string, BaseStyle> = {
  black: {
    bg: "linear-gradient(145deg, #1a1a1e 0%, #2a2a30 50%, #1a1a1e 100%)",
    text: "#ffffff",
    subtext: "#9999aa",
    shadow: "rgba(0,0,0,0.5)",
  },
  white: {
    bg: "linear-gradient(145deg, #f5f5f0 0%, #ffffff 50%, #ebebea 100%)",
    text: "#1a1a1e",
    subtext: "#666677",
    shadow: "rgba(0,0,0,0.15)",
  },
  grey: {
    bg: "linear-gradient(145deg, #55555e 0%, #6b6b74 50%, #55555e 100%)",
    text: "#ffffff",
    subtext: "#bbbbcc",
    shadow: "rgba(0,0,0,0.4)",
  },
  navy: {
    bg: "linear-gradient(145deg, #1a1a3e 0%, #2a2a50 50%, #1a1a3e 100%)",
    text: "#ffffff",
    subtext: "#9999bb",
    shadow: "rgba(0,0,0,0.5)",
  },
  forest: {
    bg: "linear-gradient(145deg, #1a2e1a 0%, #2a402a 50%, #1a2e1a 100%)",
    text: "#ffffff",
    subtext: "#99bb99",
    shadow: "rgba(0,0,0,0.45)",
  },
  wine: {
    bg: "linear-gradient(145deg, #3a1a2a 0%, #4e2838 50%, #3a1a2a 100%)",
    text: "#ffffff",
    subtext: "#cc99aa",
    shadow: "rgba(0,0,0,0.45)",
  },
  gold: {
    bg: "linear-gradient(145deg, #8a6914 0%, #c9981a 50%, #8a6914 100%)",
    text: "#ffffff",
    subtext: "#ffe0a0",
    shadow: "rgba(100,70,0,0.4)",
  },
};

const FINISH_OVERLAY: Record<string, string> = {
  matte: "none",
  holographic:
    "linear-gradient(135deg, rgba(255,0,150,0.08) 0%, rgba(0,255,200,0.08) 25%, rgba(100,100,255,0.08) 50%, rgba(255,200,0,0.08) 75%, rgba(255,0,150,0.08) 100%)",
  gold: "linear-gradient(145deg, rgba(212,168,75,0.25) 0%, rgba(255,215,0,0.15) 50%, rgba(212,168,75,0.25) 100%)",
  silver:
    "linear-gradient(145deg, rgba(192,192,192,0.2) 0%, rgba(230,230,230,0.15) 50%, rgba(192,192,192,0.2) 100%)",
  chrome:
    "linear-gradient(145deg, rgba(224,224,224,0.25) 0%, rgba(255,255,255,0.2) 50%, rgba(200,200,200,0.25) 100%)",
};

const DEFAULT_ACCENT = "#0D9488";

export default function Card3D(props: Card3DProps) {
  const {
    businessName,
    niche,
    studentName,
    targetCustomer,
    fontFamily: customFont,
    large,
    finish,
    accentColor,
    cardBase,
    showBack,
    backContent,
    borderStyle,
    isFounder,
    showRotateHint,
    forceFlipped,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const isFlipped = forceFlipped ?? false;
  const [isHovering, setIsHovering] = useState(false);
  const [lightX, setLightX] = useState(50);
  const [lightY, setLightY] = useState(50);
  const [hintVisible, setHintVisible] = useState(showRotateHint);

  const style = BASE_STYLES[cardBase] ?? BASE_STYLES.black;
  const accent = accentColor ?? DEFAULT_ACCENT;
  const cardFont = customFont || "var(--font-display), Satoshi, sans-serif";
  const borderRadius =
    borderStyle === "rounded" ? "16px" : borderStyle === "beveled" ? "8px" : "4px";

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Tilt: max 15 degrees
      setRotateY((x - 0.5) * 30);
      setRotateX(-(y - 0.5) * 30);

      // Light position follows cursor
      setLightX(x * 100);
      setLightY(y * 100);

      if (hintVisible) setHintVisible(false);
    },
    [hintVisible]
  );

  const handlePointerLeave = useCallback(() => {
    setRotateX(0);
    setRotateY(0);
    setLightX(50);
    setLightY(50);
    setIsHovering(false);
  }, []);

  const handlePointerEnter = useCallback(() => {
    setIsHovering(true);
  }, []);


  // Shared card face styles — fontFamily set here cascades to ALL text on both faces
  const faceBase: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius,
    backfaceVisibility: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: large ? "44px 50px" : "28px 32px",
    overflow: "hidden",
    border: `2px solid ${accent}44`,
    transition: "background 300ms cubic-bezier(0.2, 0.8, 0.2, 1), border-color 300ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    fontSize: large ? "1.6em" : "1em",
    fontFamily: cardFont,
  };

  const finishOverlay = FINISH_OVERLAY[finish] ?? "none";

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
      className="relative w-full h-full flex items-center justify-center"
      style={{ perspective: "1000px" }}
    >
      {/* Shadow layer (separate div so filter doesn't break preserve-3d) */}
      <div
        style={{
          position: "absolute",
          width: large ? "min(90%, 800px)" : "min(90%, 500px)",
          height: large ? "min(80%, 500px)" : "min(70%, 315px)",
          borderRadius,
          background: style.shadow,
          transform: `rotateX(${rotateX}deg) rotateY(${isFlipped ? rotateY + 180 : rotateY}deg) translateZ(-2px)`,
          filter: `blur(${16 + Math.abs(rotateX) * 0.5}px)`,
          opacity: 0.5,
          transition: isHovering
            ? "transform 0.05s ease-out"
            : "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
          pointerEvents: "none",
        }}
      />
      {/* Card container */}
      <div
        style={{
          width: large ? "min(90%, 800px)" : "min(90%, 500px)",
          height: large ? "min(80%, 500px)" : "min(70%, 315px)",
          position: "relative",
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotateX}deg) rotateY(${isFlipped ? rotateY + 180 : rotateY}deg)`,
          transition: isHovering
            ? "transform 0.05s ease-out"
            : "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {/* ---- FRONT FACE ---- */}
        <div
          style={{
            ...faceBase,
            background: style.bg,
          }}
        >
          {/* Finish overlay */}
          {finishOverlay !== "none" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius,
                background: finishOverlay,
                pointerEvents: "none",
              }}
            />
          )}

          {/* Moving light reflection */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius,
              background: `radial-gradient(circle at ${lightX}% ${lightY}%, rgba(255,255,255,${
                finish === "matte" ? 0.06 : 0.15
              }) 0%, transparent 60%)`,
              pointerEvents: "none",
              transition: isHovering ? "none" : "background 0.4s ease-out",
            }}
          />

          {/* Top section: business info */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                fontFamily: cardFont,
                fontSize: "1.375em",
                fontWeight: 700,
                color: style.text,
                lineHeight: 1.2,
                marginBottom: "6px",
              }}
            >
              {businessName}
            </div>
            <div
              style={{
                width: "2.5em",
                height: "0.1875em",
                background: accent,
                borderRadius: "2px",
                marginBottom: "8px",
              }}
            />
            <div
              style={{
                fontSize: "0.8125em",
                color: style.subtext,
                fontWeight: 500,
              }}
            >
              {niche}
            </div>
          </div>

          {/* Bottom section: name + customer */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{
                fontSize: "0.875em",
                fontWeight: 600,
                color: style.text,
              }}
            >
              {studentName}
            </div>
            {targetCustomer && (
              <div
                style={{
                  fontSize: "0.6875em",
                  color: style.subtext,
                  textAlign: "right",
                  maxWidth: "45%",
                }}
              >
                {targetCustomer}
              </div>
            )}
          </div>

          {/* Founder badge */}
          {isFounder && (
            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: accent,
                color: "#ffffff",
                fontSize: "0.5625em",
                fontWeight: 700,
                padding: "0.25em 0.625em",
                borderRadius: "3px",
                letterSpacing: "0.08em",
                zIndex: 1,
              }}
            >
              VENTURE FOUNDER
            </div>
          )}
        </div>

        {/* ---- BACK FACE ---- */}
        {showBack && (
          <div
            style={{
              ...faceBase,
              background: style.bg,
              transform: "rotateY(180deg)",
              padding: "24px 28px",
            }}
          >
            {/* Finish overlay on back too */}
            {finishOverlay !== "none" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius,
                  background: finishOverlay,
                  pointerEvents: "none",
                }}
              />
            )}

            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontSize: "0.75em",
                  fontWeight: 700,
                  color: accent,
                  letterSpacing: "0.06em",
                  marginBottom: "4px",
                }}
              >
                ACHIEVEMENTS
              </div>
              <div
                style={{
                  width: "2em",
                  height: "0.125em",
                  background: accent,
                  borderRadius: "1px",
                  marginBottom: "16px",
                }}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                {backContent.achievements.slice(0, 6).map((ach, i) => (
                  <div
                    key={ach.name + i}
                    style={{
                      fontSize: "0.6875em",
                      color: style.text,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>{ach.icon}</span>
                    <span style={{ opacity: 0.9 }}>{ach.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Adaptable branding */}
            <div
              style={{
                position: "absolute",
                bottom: "14px",
                right: "18px",
                zIndex: 1,
                fontSize: "0.5625em",
                fontWeight: 600,
                color: style.subtext,
                opacity: 0.4,
                letterSpacing: "0.05em",
              }}
            >
              Adaptable
            </div>
          </div>
        )}
      </div>

      {/* Rotate hint */}
      {hintVisible && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[var(--bg)]/80 border border-[var(--border)] text-sm text-[var(--text-muted)] backdrop-blur-sm pointer-events-none"
        >
          Hover to tilt
        </div>
      )}
    </div>
  );
}
