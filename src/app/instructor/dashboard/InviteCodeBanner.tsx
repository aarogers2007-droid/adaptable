"use client";

import { useState } from "react";

interface InviteCodeBannerProps {
  inviteCode: string | null;
  className: string;
  studentCount: number;
}

export default function InviteCodeBanner({
  inviteCode,
  className: cls,
  studentCount,
}: InviteCodeBannerProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  async function handleCopy() {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  }

  if (!inviteCode) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-secondary)]">
            Invite code for <span className="font-medium text-[var(--text-primary)]">{cls}</span>:
          </span>
          <code className="rounded-md bg-[var(--bg-muted)] px-3 py-1 font-mono text-sm font-bold tracking-wider text-[var(--primary-dark)]">
            {inviteCode}
          </code>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={() => setShowQR(true)}
            className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors"
          >
            QR Code
          </button>
        </div>

        <span className="ml-auto text-xs text-[var(--text-muted)]">
          {studentCount} student{studentCount !== 1 ? "s" : ""} enrolled
        </span>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-lg">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--text-primary)]">
              Share Invite Code
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Students can scan this or enter code <strong>{inviteCode}</strong>
            </p>
            {/* QR Placeholder */}
            <div className="mt-4 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--bg-subtle)]">
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--text-muted)]">QR Code</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Coming soon</p>
              </div>
            </div>
            <button
              onClick={() => setShowQR(false)}
              className="mt-4 w-full rounded-lg border border-[var(--border)] py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
