"use client";

import { useState, useEffect } from "react";
import { createOrgStub, checkSubdomainAvailability } from "./actions";

function toSubdomain(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
}

interface Step2Props {
  onComplete: (orgId: string, orgName: string, subdomain: string) => void;
  error: string | null;
  setError: (e: string | null) => void;
}

export default function Step2Program({ onComplete, error, setError }: Step2Props) {
  const [orgName, setOrgName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Debounced subdomain availability check
  useEffect(() => {
    if (subdomain.length < 3) { setSubdomainAvailable(null); setSubdomainError(null); return; }
    setSubdomainChecking(true); setSubdomainAvailable(null); setSubdomainError(null);
    const timer = setTimeout(async () => {
      const result = await checkSubdomainAvailability(subdomain);
      setSubdomainAvailable(result.available);
      setSubdomainError(result.error ?? null);
      setSubdomainChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [subdomain]);

  const isValid = orgName.trim().length >= 2 && subdomain.length >= 3 && subdomainAvailable === true;

  async function handleSubmit() {
    setError(null); setSubmitting(true);
    const result = await createOrgStub(orgName.trim(), subdomain);
    if ("error" in result) { setError(result.error); setSubmitting(false); return; }
    onComplete(result.orgId, orgName.trim(), subdomain);
  }

  return (
    <div className="mx-auto max-w-md step-enter">
      <h1 className="font-[family-name:var(--font-display)] text-[32px] leading-[1.2] font-semibold text-[var(--text-primary)]">
        Set up your program
      </h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        Tell us about your organization. Students will see your name and branding, never ours.
      </p>

      <div className="mt-6 space-y-5">
        {/* Organization name */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Organization name</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value.slice(0, 100))}
            maxLength={100}
            className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
            placeholder="e.g., Riverside Academy"
            autoFocus
          />
        </div>

        {/* Program URL */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Choose your program link</label>
          <p className="text-xs text-[var(--text-muted)] mb-2">
            This is the link you&apos;ll share with students and staff. Pick a short word like &quot;learn&quot;, &quot;start&quot;, or &quot;app&quot;.
          </p>
          <div className="flex items-stretch rounded-lg border border-[var(--border-strong)] overflow-hidden focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/15 transition-all">
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32))}
              className="flex-1 px-4 py-3 text-sm font-mono outline-none bg-transparent min-w-0"
              placeholder="learn"
            />
            <div className="flex items-center px-4 bg-[var(--bg-muted)] border-l border-[var(--border)] text-sm font-mono text-[var(--text-muted)] select-none whitespace-nowrap">
              .{toSubdomain(orgName) || "yourorg"}.org
            </div>
          </div>

          {/* Availability indicator */}
          {subdomain.length >= 3 && (
            <div className="mt-1.5 flex items-center gap-1.5">
              {subdomainChecking ? (
                <span className="text-xs text-[var(--text-muted)]">Checking...</span>
              ) : subdomainAvailable === true ? (
                <span className="text-xs text-[#059669] font-medium flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Available
                </span>
              ) : subdomainAvailable === false ? (
                <span className="text-xs text-[var(--error)] font-medium flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {subdomainError || "Not available"}
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid || submitting}
        className="mt-8 w-full rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--primary-dark)] disabled:opacity-50"
        style={{ minHeight: 44, boxShadow: "0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)" }}
      >
        {submitting ? "Creating..." : "Continue"}
      </button>
    </div>
  );
}
