"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { launchProgram } from "./actions";

interface Step5Props {
  orgId: string;
  orgName: string;
  subdomain: string;
  error: string | null;
  setError: (e: string | null) => void;
  onBack: () => void;
}

function toSubdomain(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
}

export default function Step5Launch({ orgId, orgName, subdomain, error, setError, onBack }: Step5Props) {
  const router = useRouter();
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [launchConfirming, setLaunchConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleLaunch() {
    setError(null); setSubmitting(true);
    const result = await launchProgram(orgId);
    if ("error" in result) { setError(result.error); setSubmitting(false); return; }
    router.push("/instructor/dashboard");
  }

  const programUrl = `${subdomain}.${toSubdomain(orgName)}.org`;

  return (
    <div className="mx-auto max-w-lg step-enter">
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-display)] text-[32px] leading-[1.2] font-semibold text-[var(--text-primary)]">
          Your program is ready
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Preview everything before going live. Students won&apos;t see anything until you launch.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {/* Preview card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Preview student experience</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">See what students will see when they join</p>
            </div>
            <button type="button" onClick={() => setPreviewExpanded(!previewExpanded)} className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors" style={{ minHeight: 32 }}>
              {previewExpanded ? "Hide" : "Preview"}
            </button>
          </div>
          {previewExpanded && (
            <div className="mt-4 rounded-lg border border-[var(--border)] overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-[var(--primary)]">
                <div className="h-5 w-5 rounded bg-white/20" />
                <span className="text-xs font-semibold text-white truncate">{orgName}</span>
              </div>
              <div className="bg-[var(--bg-subtle)] p-4">
                <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Welcome to {orgName}</p>
                <div className="space-y-2">
                  <div className="rounded-lg bg-white border border-[var(--border)] p-3">
                    <div className="h-2 w-20 rounded bg-gray-200" />
                    <div className="mt-1.5 h-1.5 w-32 rounded bg-gray-100" />
                  </div>
                  <div className="rounded-lg bg-white border border-[var(--border)] p-3">
                    <div className="h-2 w-16 rounded bg-gray-200" />
                    <div className="mt-1.5 h-1.5 w-28 rounded bg-gray-100" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Program URL card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Your program is live at</p>
          <div className="mt-3 flex items-center gap-3">
            <code className="flex-1 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] px-4 py-3 font-mono text-sm font-semibold text-[var(--text-primary)] text-center">
              {programUrl}
            </code>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(programUrl); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }}
              className="rounded-lg border border-[var(--border-strong)] px-3 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors shrink-0"
              style={{ minHeight: 44 }}
            >
              {codeCopied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Share this link with your students and staff. Anyone who visits can sign up and start the program.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]">{error}</div>
      )}

      {/* Launch confirmation */}
      {!launchConfirming ? (
        <div className="mt-8 flex gap-3">
          <button type="button" onClick={onBack} className="rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors" style={{ minHeight: 48 }}>Back</button>
          <button type="button" onClick={() => setLaunchConfirming(true)} className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-4 text-base font-semibold text-white transition-all hover:bg-[var(--primary-dark)]" style={{ minHeight: 48, boxShadow: "0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
            Launch Program
          </button>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border-2 border-[var(--primary)] bg-[var(--primary)]/5 p-5">
          <p className="text-sm text-[var(--text-secondary)]">
            Once you launch, students can access your program at{" "}
            <span className="font-mono font-semibold text-[var(--text-primary)]">{programUrl}</span>
          </p>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => setLaunchConfirming(false)} className="rounded-lg border border-[var(--border-strong)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors" style={{ minHeight: 44 }}>Not yet</button>
            <button type="button" onClick={handleLaunch} disabled={submitting} className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50" style={{ minHeight: 44 }}>
              {submitting ? "Launching..." : "Yes, launch now"}
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
        Need help? Email{" "}
        <a href="mailto:aj@adaptable.one" className="text-[var(--primary)] hover:underline">aj@adaptable.one</a>
      </p>
    </div>
  );
}
