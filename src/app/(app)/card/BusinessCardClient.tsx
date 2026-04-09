"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Card3D from "./Card3D";
import type { CardConfig } from "./card-actions";
import { saveCardConfig } from "./card-actions";
import ShareButton from "./ShareButton";
import { moderateContent } from "@/lib/content-moderation";

const CARD_FONTS = [
  { id: "satoshi", label: "Satoshi", family: "Satoshi, system-ui, sans-serif", unlockAt: 0 },
  { id: "helvetica", label: "Helvetica", family: "Helvetica Neue, Helvetica, Arial, sans-serif", unlockAt: 0 },
  { id: "times", label: "Times New Roman", family: "Times New Roman, Times, serif", unlockAt: 500 },
  { id: "georgia", label: "Georgia", family: "Georgia, Times, serif", unlockAt: 1000 },
  { id: "courier", label: "Courier", family: "Courier New, Courier, monospace", unlockAt: 2000 },
  { id: "palatino", label: "Palatino", family: "Palatino Linotype, Palatino, Book Antiqua, serif", unlockAt: 3000 },
  { id: "futura", label: "Futura", family: "Futura, Century Gothic, sans-serif", unlockAt: 5000 },
  { id: "garamond", label: "Garamond", family: "Garamond, EB Garamond, serif", unlockAt: 8000 },
];

const BASE_OPTIONS = [
  { value: "black", label: "Black", color: "#1a1a1e" },
  { value: "white", label: "White", color: "#f5f5f0" },
  { value: "grey", label: "Grey", color: "#6b6b74" },
  { value: "navy", label: "Navy", color: "#1a1a3e" },
  { value: "forest", label: "Forest", color: "#1a2e1a" },
  { value: "wine", label: "Wine", color: "#3a1a2a" },
  { value: "gold", label: "Gold ★", color: "#c9981a", founder: true },
];

const ACCENT_COLORS = [
  "#0D9488", "#3B82F6", "#8B5CF6", "#EC4899",
  "#EF4444", "#10B981", "#F97316", "#D4A84B",
];

const FINISHES: { id: string; label: string; lockKey?: string }[] = [
  { id: "matte", label: "Matte" },
  { id: "holographic", label: "Holo", lockKey: "hasHolographic" },
  { id: "silver", label: "Silver", lockKey: "hasMetallic" },
  { id: "chrome", label: "Chrome", lockKey: "hasMetallic" },
  { id: "gold", label: "Gold ★", lockKey: "isFounder" },
];

interface BusinessCardClientProps {
  businessName: string;
  niche: string;
  studentName: string;
  targetCustomer?: string;
  config: CardConfig;
  unlocks: {
    hasBase: boolean;
    hasTargetCustomer: boolean;
    hasHolographic: boolean;
    hasBack: boolean;
    hasMetallic: boolean;
    isFounder: boolean;
  };
  achievements: { id: string; name: string; icon: string; tier: string }[];
  totalCharsWritten: number;
}

type Tab = "text" | "style" | "font";

export default function BusinessCardClient({
  businessName,
  niche,
  studentName,
  targetCustomer,
  config: initialConfig,
  unlocks,
  achievements,
  totalCharsWritten,
}: BusinessCardClientProps) {
  const [config, setConfig] = useState<CardConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [cardName, setCardName] = useState(businessName);
  const [cardDescription, setCardDescription] = useState(niche);
  const [cardTextError, setCardTextError] = useState<string | null>(null);

  const handleCardNameChange = useCallback((value: string) => {
    const result = moderateContent(value);
    if (!result.safe) {
      setCardTextError(result.reason ?? "That content isn't appropriate.");
      return;
    }
    setCardTextError(null);
    setCardName(value);
  }, []);

  const handleCardDescChange = useCallback((value: string) => {
    const result = moderateContent(value);
    if (!result.safe) {
      setCardTextError(result.reason ?? "That content isn't appropriate.");
      return;
    }
    setCardTextError(null);
    setCardDescription(value);
  }, []);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFont, setSelectedFont] = useState(config.cardFont ?? "satoshi");
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const cardRef = useRef<HTMLDivElement>(null);

  const unlockedFonts = CARD_FONTS.filter((f) => totalCharsWritten >= f.unlockAt);
  const nextLockFont = CARD_FONTS.find((f) => totalCharsWritten < f.unlockAt);

  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setIsFullscreen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen]);

  const handleChange = useCallback((key: string, value: string | null) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveCardConfig({ ...config, cardFont: selectedFont });
    } finally {
      setSaving(false);
    }
  }, [config, selectedFont]);

  const backContent = {
    achievements: achievements.slice(0, 8),
    stats: undefined,
  };

  const currentFont = CARD_FONTS.find((f) => f.id === selectedFont)?.family;

  const cardProps = {
    businessName: cardName,
    niche: cardDescription,
    studentName,
    targetCustomer,
    finish: config.finish as "matte" | "holographic" | "gold" | "silver" | "chrome",
    accentColor: config.accentColor,
    cardBase: config.cardBase ?? "black",
    showBack: unlocks.hasBack,
    forceFlipped: flipped,
    backContent,
    borderStyle: config.borderStyle as "clean" | "rounded" | "beveled",
    isFounder: unlocks.isFounder,
    fontFamily: currentFont,
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8">
      {/* Title */}
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-center mb-8">
        My Business Card
      </h2>

      {/* Card preview — hero, centered. Real US business card is 3.5"×2"
          which is 1.75:1 (7/4) — locked here so the wrapper matches the
          card itself. */}
      <div className="mx-auto max-w-[560px]">
        <div ref={cardRef} style={{ aspectRatio: "7 / 4" }}>
          <Card3D {...cardProps} showRotateHint={true} />
        </div>
      </div>

      {/* Action buttons — icon-only, centered */}
      <div className="flex items-center justify-center gap-2 mt-4 mb-6">
        {unlocks.hasBack && (
          <button
            onClick={() => setFlipped((f) => !f)}
            title="Flip Card"
            className="w-10 h-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center hover:bg-[var(--bg-muted)] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </button>
        )}
        <button
          onClick={() => setIsFullscreen(true)}
          title="Fullscreen"
          className="w-10 h-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] flex items-center justify-center hover:bg-[var(--bg-muted)] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
        <ShareButton canvasElement={null} businessName={cardName} />
      </div>

      {/* Tabbed control panel */}
      <div className="mx-auto max-w-[600px] rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-[var(--border)]">
          {(["text", "style", "font"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-[var(--primary)] border-b-2 border-[var(--primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {/* TEXT TAB */}
          {activeTab === "text" && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[var(--text-muted)]">Business Name</label>
                  <span className="text-xs text-[var(--text-muted)]">{cardName.length}/40</span>
                </div>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => handleCardNameChange(e.target.value)}
                  maxLength={40}
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[var(--text-muted)]">Description</label>
                  <span className="text-xs text-[var(--text-muted)]">{cardDescription.length}/60</span>
                </div>
                <input
                  type="text"
                  value={cardDescription}
                  onChange={(e) => handleCardDescChange(e.target.value)}
                  maxLength={60}
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                />
              </div>
              {cardTextError && (
                <p className="text-xs text-[var(--error)]">{cardTextError}</p>
              )}
              <p className="text-xs text-[var(--text-muted)]">Changes are for your card only and don&apos;t affect your business profile.</p>
            </div>
          )}

          {/* STYLE TAB */}
          {activeTab === "style" && (
            <div className="space-y-5">
              {/* Card Color */}
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Card Color</p>
                <div className="flex flex-wrap gap-2">
                  {BASE_OPTIONS.map((opt) => {
                    const locked = opt.founder && !unlocks.isFounder;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => !locked && handleChange("cardBase", opt.value)}
                        disabled={locked}
                        className={`flex flex-col items-center gap-1 ${locked ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <div
                          className={`w-10 h-7 rounded border-2 transition-all ${
                            (config.cardBase ?? "black") === opt.value
                              ? "border-[var(--primary)] scale-110 shadow-sm" : "border-[var(--border)]"
                          }`}
                          style={{ backgroundColor: opt.color }}
                        />
                        <span className="text-[10px] text-[var(--text-muted)]">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Accent Color</p>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleChange("accentColor", color)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        config.accentColor === color ? "border-[var(--primary)] scale-110" : "border-[var(--border)]"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <button
                    onClick={() => handleChange("accentColor", null)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${
                      config.accentColor === null ? "border-[var(--primary)] scale-110" : "border-[var(--border)]"
                    } bg-[var(--bg-muted)]`}
                    title="Default"
                  >
                    <span className="text-[10px] text-[var(--text-muted)]">A</span>
                  </button>
                </div>
              </div>

              {/* Card Finish */}
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Finish</p>
                <div className="flex flex-wrap gap-1.5">
                  {FINISHES.map((f) => {
                    const isLocked = f.lockKey ? !unlocks[f.lockKey as keyof typeof unlocks] : false;
                    return (
                      <button
                        key={f.id}
                        onClick={() => !isLocked && handleChange("finish", f.id)}
                        disabled={isLocked}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          config.finish === f.id
                            ? "bg-[var(--primary)] text-white"
                            : isLocked
                              ? "opacity-40 cursor-not-allowed border border-[var(--border)] text-[var(--text-muted)]"
                              : "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Border Style */}
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Border</p>
                <div className="flex flex-wrap gap-1.5">
                  {(["clean", "rounded", "beveled"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleChange("borderStyle", s)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        config.borderStyle === s
                          ? "bg-[var(--primary)] text-white"
                          : "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Back */}
              <div>
                <p className="text-xs font-medium text-[var(--text-primary)] mb-1">Card Back</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {unlocks.hasBack
                    ? "Your achievements are displayed on the back."
                    : "Complete Lesson 5 to unlock."}
                </p>
              </div>
            </div>
          )}

          {/* FONT TAB */}
          {activeTab === "font" && (
            <div>
              <div className="flex flex-wrap gap-2">
                {CARD_FONTS.map((font) => {
                  const isUnlocked = totalCharsWritten >= font.unlockAt;
                  return (
                    <button
                      key={font.id}
                      onClick={() => isUnlocked && setSelectedFont(font.id)}
                      disabled={!isUnlocked}
                      className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                        selectedFont === font.id
                          ? "bg-[var(--primary)] text-white"
                          : isUnlocked
                            ? "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                            : "opacity-35 cursor-not-allowed border border-[var(--border)] text-[var(--text-muted)]"
                      }`}
                    >
                      <span style={{ fontFamily: isUnlocked ? font.family : undefined }}>{font.label}</span>
                    </button>
                  );
                })}
              </div>
              {nextLockFont && (
                <div className="mt-4">
                  <p className="text-xs text-[var(--text-muted)]">
                    Write {(nextLockFont.unlockAt - totalCharsWritten).toLocaleString()} more characters to unlock {nextLockFont.label}.
                  </p>
                  <div className="mt-1.5 h-1 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                    <div
                      className="h-1 rounded-full bg-[var(--primary)] transition-all"
                      style={{ width: `${Math.min(100, (totalCharsWritten / nextLockFont.unlockAt) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save button — always visible */}
      <div className="mx-auto max-w-[280px] mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Progression banner */}
      {!unlocks.hasHolographic && (
        <div className="mx-auto max-w-[600px] mt-4 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-4 py-3 text-sm text-[var(--text-secondary)] text-center">
          <span className="font-medium text-[var(--primary)]">Your card levels up as you progress.</span>{" "}
          Complete lessons to unlock new finishes, colors, and features.
        </div>
      )}

      {/* Fullscreen overlay — immersive dark */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsFullscreen(false); }}
        >
          {/* Close button */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="fixed top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors z-10"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Card */}
          {/* Fullscreen card — locked to 1.75:1 (real business card ratio).
              max width 800 → max height 800/1.75 ≈ 457. */}
          <div className="w-full max-w-[800px] m-8" style={{ aspectRatio: "7 / 4", maxHeight: "457px" }}>
            <Card3D {...cardProps} showRotateHint={false} large />
          </div>

          {/* Flip button */}
          {unlocks.hasBack && (
            <button
              onClick={() => setFlipped((f) => !f)}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full px-6 py-2 text-sm font-medium text-white transition-colors flex items-center gap-2"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              Flip
            </button>
          )}
        </div>
      )}
    </div>
  );
}
