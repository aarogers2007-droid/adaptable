"use client";

interface MCOption {
  letter: string;
  text: string;
}

interface Props {
  options: MCOption[];
  onSelect: (option: MCOption) => void;
  disabled?: boolean;
}

/**
 * Multiple choice decision cards for scenario chat.
 * 2x2 grid on desktop, stacked on mobile.
 * Each card shows letter + option text. On click, sends the selection.
 */
export default function MCOptions({ options, onSelect, disabled }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-4 py-3">
      {options.map((opt) => (
        <button
          key={opt.letter}
          onClick={() => onSelect(opt)}
          disabled={disabled}
          className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-left transition-all hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 active:scale-[0.98] disabled:opacity-50"
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: "var(--primary)" }}
          >
            {opt.letter}
          </span>
          <span className="text-sm text-[var(--text-primary)] leading-snug pt-0.5">
            {opt.text}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Parse [OPTIONS]...[/OPTIONS] block from AI message text.
 * Returns { visibleText, options } or null if no OPTIONS block found.
 */
export function parseOptionsBlock(text: string): {
  visibleText: string;
  options: MCOption[];
} | null {
  const match = text.match(/\[OPTIONS\]([\s\S]*?)\[\/OPTIONS\]/);
  if (!match) return null;

  const visibleText = text.replace(/\[OPTIONS\][\s\S]*?\[\/OPTIONS\]/, "").trim();
  const lines = match[1].trim().split("\n").filter(Boolean);

  const options: MCOption[] = [];
  for (const line of lines) {
    const optMatch = line.trim().match(/^([A-D])\.\s*(.+)$/);
    if (optMatch) {
      options.push({ letter: optMatch[1], text: optMatch[2].trim() });
    }
  }

  if (options.length < 2) return null; // need at least 2 valid options
  return { visibleText, options };
}
