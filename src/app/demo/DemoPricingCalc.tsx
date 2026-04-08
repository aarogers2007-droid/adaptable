"use client";

import { useState } from "react";

/**
 * Demo pricing calculator — pure client component.
 *
 * Mirrors the lesson 5 ("Setting Profitable Prices") pressure-test:
 * type your hourly rate + how long it takes you to deliver, and the calculator
 * tells you what you're actually paying yourself per hour. Most teens
 * undercharge wildly because they don't account for their time. The point of
 * this widget is to make that visible in 2 inputs.
 *
 * No backend, no AI, no cost. Pure math. Used on /demo to give visitors a
 * tactile preview of what a real lesson teaches.
 */
export default function DemoPricingCalc() {
  const [price, setPrice] = useState(25);
  const [hours, setHours] = useState(3);

  const hourly = hours > 0 ? price / hours : 0;
  const verdict =
    hourly >= 30
      ? { label: "Solid — you're charging your worth.", tone: "good" as const }
      : hourly >= 15
      ? { label: "Decent — but you could probably charge more.", tone: "ok" as const }
      : hourly >= 8
      ? { label: "You're paying yourself less than minimum wage.", tone: "warn" as const }
      : { label: "You're losing money on every job. Charge more.", tone: "bad" as const };

  const toneClass = {
    good: "bg-emerald-50 border-emerald-200 text-emerald-800",
    ok: "bg-blue-50 border-blue-200 text-blue-800",
    warn: "bg-amber-50 border-amber-200 text-amber-900",
    bad: "bg-red-50 border-red-200 text-red-800",
  }[verdict.tone];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
      <p className="text-xs font-medium text-[var(--accent)] uppercase tracking-wider">
        Pressure-test your price
      </p>
      <p className="mt-2 text-base text-[var(--text-secondary)]">
        Most teens undercharge because they forget their time costs money. Type your numbers — the calculator does the rest.
      </p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Your price
          </span>
          <div className="mt-1 flex items-center rounded-lg border border-[var(--border-strong)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/15 transition-colors">
            <span className="pl-4 text-lg text-[var(--text-muted)]">$</span>
            <input
              type="number"
              min={1}
              max={9999}
              step={1}
              value={price}
              onChange={(e) => setPrice(Math.max(0, Math.min(9999, Number(e.target.value) || 0)))}
              className="w-full bg-transparent px-2 py-3 text-lg font-semibold text-[var(--text-primary)] outline-none"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Hours per job
          </span>
          <div className="mt-1 flex items-center rounded-lg border border-[var(--border-strong)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/15 transition-colors">
            <input
              type="number"
              min={0.25}
              max={200}
              step={0.25}
              value={hours}
              onChange={(e) => setHours(Math.max(0, Math.min(200, Number(e.target.value) || 0)))}
              className="w-full bg-transparent pl-4 py-3 text-lg font-semibold text-[var(--text-primary)] outline-none"
            />
            <span className="pr-4 text-sm text-[var(--text-muted)]">hours</span>
          </div>
        </label>
      </div>

      <div className="mt-5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] p-5 text-center">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
          You&apos;re paying yourself
        </p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-[44px] font-bold leading-none text-[var(--text-primary)] tabular-nums">
          ${hourly.toFixed(2)}
        </p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">per hour</p>
      </div>

      <div className={`mt-3 rounded-lg border px-4 py-3 text-sm font-medium text-center ${toneClass}`}>
        {verdict.label}
      </div>

      <p className="mt-4 text-xs text-[var(--text-muted)] text-center">
        Real students do this exercise in lesson 5, then a Socratic AI mentor pressure-tests their answer.
      </p>
    </div>
  );
}
