"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyPin } from "./actions";

export default function ParentPinForm({
  token,
  studentName,
}: {
  token: string;
  studentName: string;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (attempts >= 5) {
      setError("Too many attempts. Try again in 15 minutes.");
      return;
    }

    setError(null);
    setLoading(true);
    setAttempts((a) => a + 1);

    const result = await verifyPin(token, pin);

    if (result.success) {
      router.push(`/parent/view?token=${token}&verified=true`);
    } else {
      setError(result.error ?? "Incorrect PIN");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          View {studentName}&apos;s Progress
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Enter the 6-digit PIN to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
            autoFocus
          />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pin.length < 6 || loading || attempts >= 5}
            className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
          >
            {loading ? "Verifying..." : "View Progress"}
          </button>

          {attempts > 0 && attempts < 5 && (
            <p className="text-xs text-[var(--text-muted)]">
              {5 - attempts} attempts remaining
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
