"use client";

import { useState } from "react";

interface QuickReactionProps {
  question: string;
  options?: [string, string];
  onSelect: (choice: string) => void;
}

export default function QuickReaction({
  question,
  options = ["Yes", "No"],
  onSelect,
}: QuickReactionProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(choice: string) {
    if (selected) return;
    setSelected(choice);
    onSelect(choice);
  }

  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "8px",
        border: "1px solid var(--border)",
        backgroundColor: "var(--bg-subtle)",
      }}
    >
      <p
        style={{
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--text-primary)",
          marginBottom: "12px",
        }}
      >
        {question}
      </p>

      <div style={{ display: "flex", gap: "8px" }}>
        {options.map((option) => {
          const isSelected = selected === option;
          const isDisabled = selected !== null && !isSelected;

          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={selected !== null}
              aria-pressed={isSelected}
              style={{
                padding: "8px 24px",
                borderRadius: "8px",
                border: isSelected
                  ? "1px solid var(--primary)"
                  : "1px solid var(--border)",
                backgroundColor: isSelected ? "var(--primary)" : "var(--bg)",
                color: isSelected ? "#fff" : "var(--text-primary)",
                fontSize: "14px",
                fontWeight: 500,
                cursor: selected ? "default" : "pointer",
                opacity: isDisabled ? 0.5 : 1,
                transition: "all 150ms ease-out",
              }}
              onMouseEnter={(e) => {
                if (!selected) {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.color = "var(--primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!selected && !isSelected) {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
