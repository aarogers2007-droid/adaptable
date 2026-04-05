"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyPin, createPin } from "./actions";

export default function ParentPinForm({
  token,
  studentName,
  hasPin,
  teacherName,
  className,
}: {
  token: string;
  studentName: string;
  hasPin: boolean;
  teacherName?: string | null;
  className?: string | null;
}) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();

  const isCreate = !hasPin;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isCreate) {
      if (pin.length < 6) {
        setError("PIN must be 6 digits.");
        return;
      }
      if (pin !== confirmPin) {
        setError("PINs do not match.");
        return;
      }
    } else {
      if (attempts >= 5) {
        setError("Too many attempts. Try again in 15 minutes.");
        return;
      }
    }

    setError(null);
    setLoading(true);

    if (isCreate) {
      const result = await createPin(token, pin);
      if (result.success) {
        router.push(`/parent/view?token=${token}`);
      } else {
        setError(result.error ?? "Failed to create PIN.");
        setLoading(false);
      }
    } else {
      setAttempts((a) => a + 1);
      const result = await verifyPin(token, pin);
      if (result.success) {
        router.push(`/parent/view?token=${token}`);
      } else {
        setError(result.error ?? "Incorrect PIN");
        setLoading(false);
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-subtle)] px-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="mb-8">
          <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--primary)]">
            Adaptable
          </span>
          <span className="mx-2 text-[var(--text-muted)]">&middot;</span>
          <span className="text-sm text-[var(--text-muted)]">Parent View</span>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-8 shadow-sm">
          {isCreate ? (
            <>
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
                Welcome!
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Create a 6-digit PIN to securely view {studentName}&apos;s progress.
              </p>
              {(teacherName || className) && (
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Sent by {teacherName ?? "their teacher"}
                  {className ? ` \u00b7 ${className}` : ""}
                </p>
              )}
            </>
          ) : (
            <>
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
                {studentName}&apos;s Progress
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Enter your 6-digit PIN to continue.
              </p>
            </>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              {isCreate && (
                <label className="mb-1 block text-left text-xs font-medium text-[var(--text-secondary)]">
                  Create PIN
                </label>
              )}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                autoFocus
              />
            </div>

            {isCreate && (
              <div>
                <label className="mb-1 block text-left text-xs font-medium text-[var(--text-secondary)]">
                  Confirm PIN
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]*"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                isCreate
                  ? pin.length < 6 || confirmPin.length < 6 || loading
                  : pin.length < 6 || loading || attempts >= 5
              }
              className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
            >
              {loading
                ? isCreate
                  ? "Creating..."
                  : "Verifying..."
                : isCreate
                  ? "Create PIN & View Progress"
                  : "View Progress"}
            </button>

            {!isCreate && attempts > 0 && attempts < 5 && (
              <p className="text-xs text-[var(--text-muted)]">
                {5 - attempts} attempts remaining
              </p>
            )}
          </form>
        </div>

        {isCreate && (
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            You&apos;ll use this PIN each time you visit.
          </p>
        )}
      </div>
    </main>
  );
}
