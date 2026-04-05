"use client";

interface CustomizationPanelProps {
  config: {
    finish: string;
    accentColor: string | null;
    cardBase?: string;
    backDesign: string;
    borderStyle: string;
  };
  unlocks: {
    hasBase: boolean;
    hasTargetCustomer: boolean;
    hasHolographic: boolean;
    hasBack: boolean;
    hasMetallic: boolean;
    isFounder: boolean;
  };
  onChange: (key: string, value: string | null) => void;
  onSave: () => void;
  saving: boolean;
}

const ACCENT_COLORS = [
  "#0D9488", // teal (primary)
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#EF4444", // red
  "#10B981", // emerald
  "#F97316", // orange
  "#D4A84B", // gold
];


function Chip({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? "bg-[var(--primary)] text-white"
          : "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {label}
    </button>
  );
}

const BASE_OPTIONS = [
  { value: "black", label: "Black", color: "#1a1a1e" },
  { value: "white", label: "White", color: "#f5f5f0" },
  { value: "grey", label: "Grey", color: "#6b6b74" },
  { value: "navy", label: "Navy", color: "#1a1a3e" },
  { value: "forest", label: "Forest", color: "#1a2e1a" },
  { value: "wine", label: "Wine", color: "#3a1a2a" },
  { value: "gold", label: "Gold ★", color: "#c9981a", requiresFounder: true },
];

export default function CustomizationPanel({
  config,
  unlocks,
  onChange,
  onSave,
  saving,
}: CustomizationPanelProps) {
  const currentBase = config.cardBase ?? "black";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 space-y-6">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
        Customize
      </h2>

      {/* Progression framing — shown when most items are locked */}
      {!unlocks.hasHolographic && (
        <div className="rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-4 py-3 text-sm text-[var(--text-secondary)]">
          <span className="font-medium text-[var(--primary)]">Your card levels up as you progress.</span>{" "}
          Complete lessons to unlock new finishes, colors, and features.
        </div>
      )}

      {/* Card Base Color */}
      <div>
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Card Color</h3>
        <div className="flex flex-wrap gap-3">
          {BASE_OPTIONS.map((opt) => {
            const locked = "requiresFounder" in opt && opt.requiresFounder && !unlocks.isFounder;
            return (
              <div key={opt.value} className="relative">
                <button
                  onClick={() => !locked && onChange("cardBase", opt.value)}
                  disabled={locked}
                  className={`flex flex-col items-center gap-1.5 group ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div
                    className={`w-12 h-8 rounded-lg border-2 transition-all ${
                      currentBase === opt.value
                        ? "border-[var(--primary)] scale-110 shadow-md"
                        : "border-[var(--border)] group-hover:border-[var(--text-muted)]"
                    }`}
                    style={{ backgroundColor: opt.color }}
                  />
                  <span className={`text-xs ${
                    currentBase === opt.value
                      ? "text-[var(--primary)] font-medium"
                      : "text-[var(--text-muted)]"
                  }`}>
                    {opt.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Finish */}
      <div>
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Card Finish</h3>
        <div className="flex flex-wrap gap-2">
          <Chip
            label="Matte"
            selected={config.finish === "matte"}
            onClick={() => onChange("finish", "matte")}
          />

          <Chip
            label="Holographic"
            selected={config.finish === "holographic"}
            onClick={() => onChange("finish", "holographic")}
            disabled={!unlocks.hasHolographic}
          />

          {(["silver", "chrome"] as const).map((f) => (
            <Chip
              key={f}
              label={f.charAt(0).toUpperCase() + f.slice(1)}
              selected={config.finish === f}
              onClick={() => onChange("finish", f)}
              disabled={!unlocks.hasMetallic}
            />
          ))}

          <Chip
            label="Gold ★"
            selected={config.finish === "gold"}
            onClick={() => onChange("finish", "gold")}
            disabled={!unlocks.isFounder}
          />
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Accent Color</h3>
        <div className="flex flex-wrap gap-2">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onChange("accentColor", color)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                config.accentColor === color
                  ? "border-[var(--primary)] scale-110"
                  : "border-[var(--border)]"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <button
            onClick={() => onChange("accentColor", null)}
            className={`w-8 h-8 rounded-full border-2 transition-transform flex items-center justify-center ${
              config.accentColor === null
                ? "border-[var(--primary)] scale-110"
                : "border-[var(--border)]"
            } bg-[var(--bg-muted)]`}
            title="Default"
          >
            <span className="text-xs text-[var(--text-muted)]">A</span>
          </button>
        </div>
      </div>

      {/* Back Design */}
      <div className="relative">
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Card Back</h3>
        {!unlocks.hasBack ? (
          <p className="text-xs text-[var(--text-muted)] opacity-60">
            Complete Lesson 5 to unlock the card back.
          </p>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">
            Your achievements are displayed on the back of your card.
          </p>
        )}
      </div>

      {/* Border Style */}
      <div>
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Border Style</h3>
        <div className="flex flex-wrap gap-2">
          {(["clean", "rounded", "beveled"] as const).map((style) => (
            <Chip
              key={style}
              label={style.charAt(0).toUpperCase() + style.slice(1)}
              selected={config.borderStyle === style}
              onClick={() => onChange("borderStyle", style)}
            />
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={saving}
        className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
