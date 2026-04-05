"use client";

import { useState } from "react";
import Link from "next/link";

interface ReengagementBannerProps {
  studentId: string;
  studentName: string;
  businessName: string;
  teaserMessage: string;
  ctaLink: string;
}

export default function ReengagementBanner({
  studentId,
  studentName,
  businessName,
  teaserMessage,
  ctaLink,
}: ReengagementBannerProps) {
  const storageKey = `reengagement-dismissed-${studentId}`;
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(storageKey) === "true";
  });

  if (dismissed) return null;

  function handleDismiss() {
    sessionStorage.setItem(storageKey, "true");
    setDismissed(true);
  }

  return (
    <div
      role="banner"
      aria-label="Message from your AI co-founder"
      style={{
        padding: "16px 20px",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        backgroundColor: "var(--bg-subtle)",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        marginBottom: "24px",
      }}
    >
      {/* AI avatar indicator */}
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "9999px",
          backgroundColor: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "#fff",
          fontSize: "14px",
          fontWeight: 600,
        }}
        aria-hidden="true"
      >
        AI
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            marginBottom: "4px",
          }}
        >
          Hey {studentName}, about <strong>{businessName}</strong>...
        </p>
        <p
          style={{
            fontSize: "16px",
            color: "var(--text-primary)",
            fontWeight: 500,
            marginBottom: "12px",
          }}
        >
          {teaserMessage}
        </p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Link
            href={ctaLink}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              backgroundColor: "var(--primary)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
              transition: "background-color 150ms ease-out",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--primary-dark)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--primary)")}
          >
            Let&apos;s talk
          </Link>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss message"
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "transparent",
              color: "var(--text-muted)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
