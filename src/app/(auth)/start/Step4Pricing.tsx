"use client";

import { useState } from "react";

const VOLUME_TIERS = [
  { min: 1, max: 500, price: 14.99, label: "1 – 500 students" },
  { min: 501, max: 2500, price: 12.99, label: "501 – 2,500 students" },
  { min: 2501, max: 10000, price: 9.99, label: "2,501 – 10,000 students" },
  { min: 10001, max: 50000, price: 7.99, label: "10,001 – 50,000 students" },
] as const;

const IMPLEMENTATION_FEE = 2500;

function getPriceForCount(count: number): number {
  for (const tier of VOLUME_TIERS) {
    if (count >= tier.min && count <= tier.max) return tier.price;
  }
  return 7.99;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);
}

interface Step4Props {
  orgId: string;
  onBack: () => void;
  error: string | null;
  setError: (e: string | null) => void;
}

export default function Step4Pricing({ orgId, onBack, error, setError }: Step4Props) {
  const [studentCount, setStudentCount] = useState(250);
  const [studentCountInput, setStudentCountInput] = useState("250");
  const [submitting, setSubmitting] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);

  async function handleContinueToPayment() {
    if (!orgId) return;
    setError(null); setSubmitting(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: studentCount, orgId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || "Failed to create checkout session."); setSubmitting(false); return; }
      window.location.href = data.url;
    } catch { setError("Failed to connect to payment service."); setSubmitting(false); }
  }

  return (
    <div className="max-w-xl mx-auto step-enter">
      <h1 className="font-[family-name:var(--font-display)] text-[32px] leading-[1.2] font-semibold text-[var(--text-primary)]">
        How many students will use the program?
      </h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        Every feature is included at every level. The more students you bring, the less each one costs.
      </p>

      {/* Student count input */}
      <div className="mt-8">
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Estimated student count</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={studentCountInput}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, "");
            setStudentCountInput(raw);
            const v = parseInt(raw, 10);
            if (!isNaN(v) && v >= 1) setStudentCount(Math.min(v, 100000));
            else if (raw === "") setStudentCount(0);
          }}
          className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-lg outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 font-mono"
          autoFocus
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          You commit to this number annually. If enrollment exceeds your estimate by more than 10%, we&apos;ll invoice the difference at your per-student rate at the end of the contract year.
        </p>
      </div>

      {/* Volume pricing table */}
      <div className="mt-6 rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
          <thead>
            <tr className="bg-[var(--bg-subtle)]">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Students</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Per Student / Year</th>
            </tr>
          </thead>
          <tbody>
            {VOLUME_TIERS.map((tier) => {
              const isActive = studentCount >= tier.min && studentCount <= tier.max;
              return (
                <tr key={tier.min} className="border-t border-[var(--border)]" style={{ background: isActive ? "rgba(13,148,136,0.05)" : "transparent" }}>
                  <td className="px-4 py-3 text-[var(--text-primary)]" style={{ fontWeight: isActive ? 600 : 400 }}>
                    {tier.label}
                    {isActive && <span className="ml-2 text-xs font-medium text-[var(--primary)]">Your rate</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono" style={{ color: isActive ? "var(--primary)" : "var(--text-secondary)", fontWeight: isActive ? 700 : 400 }}>
                    ${tier.price}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t border-[var(--border)]">
              <td className="px-4 py-3 text-[var(--text-primary)]" style={{ fontWeight: studentCount > 50000 ? 600 : 400 }}>
                50,000+ students
                {studentCount > 50000 && <span className="ml-2 text-xs font-medium text-[var(--primary)]">Your rate</span>}
              </td>
              <td className="px-4 py-3 text-right text-[var(--text-secondary)]" style={{ fontWeight: studentCount > 50000 ? 700 : 400 }}>Custom</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total cost summary */}
      {studentCount > 0 && studentCount <= 50000 && (
        <div className="mt-6 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-5">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-mono font-medium text-[var(--text-primary)]">{studentCount.toLocaleString()}</span> students
              {" "}<span className="text-[var(--text-muted)]">&times;</span>{" "}
              <span className="font-mono font-medium text-[var(--text-primary)]">${getPriceForCount(studentCount)}</span>/student
            </p>
            <div className="text-right">
              <p className="text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(studentCount * getPriceForCount(studentCount))}</p>
              <p className="text-xs text-[var(--text-muted)]">per year (USD)</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[rgba(13,148,136,0.1)] flex items-baseline justify-between">
            <p className="text-xs text-[var(--text-muted)]">One-time setup (branding, onboarding, training)</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{formatCurrency(IMPLEMENTATION_FEE)}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-[rgba(13,148,136,0.1)] flex items-baseline justify-between">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Year 1 total</p>
            <p className="text-lg font-bold text-[var(--text-primary)]">{formatCurrency(studentCount * getPriceForCount(studentCount) + IMPLEMENTATION_FEE)}</p>
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">Annual contract, billed upfront. 90-day cancellation notice.</p>
        </div>
      )}

      {/* What's included */}
      <div className="mt-6">
        <p className="text-sm text-[var(--text-secondary)]">
          All features included: AI-guided lessons, scenarios, progress tracking, branding, impact reporting, and email support.{" "}
          <button type="button" onClick={() => setFeaturesExpanded(!featuresExpanded)} className="text-[var(--primary)] font-medium hover:underline">
            {featuresExpanded ? "Hide details" : "See details"}
          </button>
        </p>
        {featuresExpanded && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {["AI-guided lessons (your curriculum)", "Scenario simulations", "Student progress tracking", "Your branding on everything", "Impact reporting + CSV export", "Sponsor-ready scenario builder", "Email support (48hr response)"].map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <svg className="h-4 w-4 shrink-0 mt-0.5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]">{error}</div>
      )}

      {/* Custom quote */}
      <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
        <p className="text-sm text-[var(--text-secondary)]">Need a custom quote for your board? Have more than 50,000 students?</p>
        <a href="mailto:aj@adaptable.one?subject=Custom%20Quote%20Request&body=Organization%20name:%0AEstimated%20students:%0AQuestions:" className="mt-2 inline-block text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">
          Contact us for a custom quote
        </a>
      </div>

      <div className="mt-8 flex gap-3">
        <button type="button" onClick={onBack} className="rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors" style={{ minHeight: 44 }}>Back</button>
        <button type="button" onClick={handleContinueToPayment} disabled={submitting || studentCount < 1 || studentCount > 50000} className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--primary-dark)] disabled:opacity-50" style={{ minHeight: 48, boxShadow: "0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
          {submitting ? "Redirecting to checkout..." : "Continue to Payment"}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-[var(--text-muted)]">Secure payment powered by Stripe</p>
    </div>
  );
}
