"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateInviteCode, completeClassEnrollment } from "./actions";

export default function JoinClassPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [classInfo, setClassInfo] = useState<{
    className: string;
    classId: string;
    orgId: string;
  } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleValidateCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await validateInviteCode(code);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setClassInfo({
      className: result.className!,
      classId: result.classId!,
      orgId: result.orgId!,
    });
    setLoading(false);
  }

  async function handleJoinClass() {
    if (!classInfo) return;
    setError(null);
    setLoading(true);

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Store class info, redirect to signup
      sessionStorage.setItem("pendingClassJoin", JSON.stringify(classInfo));
      sessionStorage.setItem("pendingInviteCode", code.trim().toUpperCase());
      router.push("/signup");
      return;
    }

    // Enroll via server action
    const result = await completeClassEnrollment(
      classInfo.classId,
      classInfo.orgId,
      code
    );

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-center">
          Join a Class
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
          Enter the invite code your instructor gave you.
        </p>

        <div className="mt-8">
          {!classInfo ? (
            <form onSubmit={handleValidateCode} className="space-y-4">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-[var(--text-primary)]"
                >
                  Invite code
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="mt-1 block w-full rounded-lg border border-[var(--border-strong)] px-3 py-3 text-center text-lg font-mono tracking-widest outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                  placeholder="ABC123"
                  autoFocus
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length < 4}
                className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
              >
                {loading ? "Checking..." : "Join Class"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-4 text-center">
                <p className="text-sm text-[var(--text-muted)]">You're joining</p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold">
                  {classInfo.className}
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
                  {error}
                </div>
              )}

              <button
                onClick={handleJoinClass}
                disabled={loading}
                className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
              >
                {loading ? "Joining..." : "Confirm & Continue"}
              </button>

              <button
                onClick={() => {
                  setClassInfo(null);
                  setCode("");
                }}
                className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-muted)]"
              >
                Try a different code
              </button>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--primary)] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
