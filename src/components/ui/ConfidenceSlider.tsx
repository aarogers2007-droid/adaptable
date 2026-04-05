"use client";

import { useState } from "react";

interface ConfidenceSliderProps {
  question: string;
  onSubmit: (value: number) => void;
}

export default function ConfidenceSlider({ question, onSubmit }: ConfidenceSliderProps) {
  const [value, setValue] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    setSubmitted(true);
    onSubmit(value);
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

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          Not sure at all
        </span>

        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          disabled={submitted}
          aria-label={`Confidence level: ${value} out of 10`}
          style={{
            flex: 1,
            accentColor: "var(--primary)",
            cursor: submitted ? "default" : "pointer",
          }}
        />

        <span style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          Very confident
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flex: 1, padding: "0 48px" }}>
          {Array.from({ length: 10 }, (_, i) => (
            <span
              key={i + 1}
              style={{
                fontSize: "12px",
                fontVariantNumeric: "tabular-nums",
                color: i + 1 === value ? "var(--primary)" : "var(--text-muted)",
                fontWeight: i + 1 === value ? 600 : 400,
              }}
            >
              {i + 1}
            </span>
          ))}
        </div>
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          style={{
            marginTop: "12px",
            padding: "8px 20px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "var(--primary)",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "background-color 150ms ease-out",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--primary-dark)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--primary)")}
        >
          Submit
        </button>
      )}

      {submitted && (
        <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
          Confidence: {value}/10
        </p>
      )}
    </div>
  );
}
