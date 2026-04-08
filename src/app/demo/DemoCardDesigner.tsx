"use client";

import { useState } from "react";
import Card3D from "@/app/(app)/card/Card3D";

interface DemoCardDesignerProps {
  studentName: string;
  defaultBusinessName: string;
  niche: string;
  targetCustomer: string;
}

const BASE_OPTIONS = [
  { value: "black", label: "Black", color: "#1a1a1e" },
  { value: "white", label: "White", color: "#f5f5f0" },
  { value: "grey", label: "Grey", color: "#6b6b74" },
  { value: "navy", label: "Navy", color: "#1a1a3e" },
  { value: "forest", label: "Forest", color: "#1a2e1a" },
  { value: "wine", label: "Wine", color: "#3a1a2a" },
  { value: "gold", label: "Gold", color: "#c9981a" },
] as const;

const ACCENT_COLORS = [
  "#0D9488", "#3B82F6", "#8B5CF6", "#EC4899",
  "#EF4444", "#10B981", "#F97316", "#D4A84B",
];

const FINISHES = [
  { id: "matte", label: "Matte" },
  { id: "holographic", label: "Holo" },
  { id: "silver", label: "Silver" },
  { id: "chrome", label: "Chrome" },
  { id: "gold", label: "Gold" },
] as const;

const BORDERS = ["clean", "rounded", "beveled"] as const;

type CardBase = (typeof BASE_OPTIONS)[number]["value"];
type Finish = (typeof FINISHES)[number]["id"];
type Border = (typeof BORDERS)[number];

/**
 * Demo card designer — visitors customize Elsa's business card live.
 *
 * Uses the actual production Card3D component (same one real students see)
 * but pairs it with a simplified customization panel — color, accent, finish,
 * border. All unlocks are pre-unlocked for demo purposes (no founder gating,
 * no lesson-progression locks). Pure client component, no backend.
 */
export default function DemoCardDesigner({
  studentName,
  defaultBusinessName,
  niche,
  targetCustomer,
}: DemoCardDesignerProps) {
  const [businessName, setBusinessName] = useState(defaultBusinessName);
  const [cardBase, setCardBase] = useState<CardBase>("black");
  const [accentColor, setAccentColor] = useState<string>("#0D9488");
  const [finish, setFinish] = useState<Finish>("holographic");
  const [borderStyle, setBorderStyle] = useState<Border>("rounded");

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
      <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider">
        Design the card live
      </p>
      <p className="mt-2 text-base text-[var(--text-secondary)]">
        Pick a color, accent, finish, and border. The card responds in real time. Move your cursor over the card to see the 3D tilt.
      </p>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Card preview */}
        <div className="relative" style={{ height: "320px" }}>
          <Card3D
            businessName={businessName}
            niche={niche}
            studentName={studentName}
            targetCustomer={targetCustomer}
            finish={finish}
            accentColor={accentColor}
            cardBase={cardBase}
            showBack={false}
            backContent={{ achievements: [] }}
            borderStyle={borderStyle}
            isFounder={true}
            showRotateHint={false}
          />
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Business name */}
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Name on card</p>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value.slice(0, 40))}
              maxLength={40}
              className="w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
            />
          </div>

          {/* Card color */}
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Card color</p>
            <div className="flex flex-wrap gap-2">
              {BASE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCardBase(opt.value)}
                  className="flex flex-col items-center gap-1"
                  aria-label={`Card color: ${opt.label}`}
                >
                  <div
                    className={`w-9 h-7 rounded border-2 transition-all ${
                      cardBase === opt.value ? "border-[var(--primary)] scale-110 shadow-sm" : "border-[var(--border)]"
                    }`}
                    style={{ backgroundColor: opt.color }}
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent */}
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Accent</p>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccentColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    accentColor === c ? "border-[var(--primary)] scale-110" : "border-[var(--border)]"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Accent color: ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Finish */}
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Finish</p>
            <div className="flex flex-wrap gap-1.5">
              {FINISHES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFinish(f.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    finish === f.id
                      ? "bg-[var(--primary)] text-white"
                      : "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Border */}
          <div>
            <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Border</p>
            <div className="flex flex-wrap gap-1.5">
              {BORDERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setBorderStyle(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize ${
                    borderStyle === s
                      ? "bg-[var(--primary)] text-white"
                      : "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-xs text-[var(--text-muted)] text-center">
        Real students unlock new colors, fonts, and finishes as they complete lessons.
      </p>
    </div>
  );
}
