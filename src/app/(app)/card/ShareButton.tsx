"use client";

import { useCallback, useState } from "react";

interface ShareButtonProps {
  canvasElement: HTMLCanvasElement | null;
  businessName: string;
}

export default function ShareButton({ businessName }: ShareButtonProps) {
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    setCopying(true);
    try {
      const text = `Check out my venture card for ${businessName}!`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setCopying(false);
    }
  }, [businessName]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[var(--text-muted)]">Share your venture card</span>
      <button
        onClick={handleCopy}
        disabled={copying}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)] disabled:opacity-50"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        {copied ? "Copied!" : "Share"}
      </button>
    </div>
  );
}
