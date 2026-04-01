"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

    const trimmed = code.trim().toUpperCase();

    // Look up invite code
    const { data: invite, error: inviteError } = await supabase
      .from("invite_codes")
      .select("id, class_id, expires_at, max_uses, current_uses, classes(name, org_id)")
      .eq("code", trimmed)
      .single();

    if (inviteError || !invite) {
      setError("Invalid invite code. Check with your instructor.");
      setLoading(false);
      return;
    }

    // Check expiry
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      setError("This invite code has expired. Ask your instructor for a new one.");
      setLoading(false);
      return;
    }

    // Check usage limit
    if (invite.max_uses && invite.current_uses >= invite.max_uses) {
      setError("This invite code has reached its limit. Ask your instructor for a new one.");
      setLoading(false);
      return;
    }

    const classData = invite.classes as unknown as { name: string; org_id: string };
    setClassInfo({
      className: classData.name,
      classId: invite.class_id,
      orgId: classData.org_id,
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
      // Store class info in sessionStorage, redirect to signup
      sessionStorage.setItem("pendingClassJoin", JSON.stringify(classInfo));
      sessionStorage.setItem("pendingInviteCode", code.trim().toUpperCase());
      router.push("/signup");
      return;
    }

    // Enroll in class
    const enrollResult = await enrollInClass(user.id, classInfo.classId, classInfo.orgId);
    if (!enrollResult.success) {
      setError(enrollResult.error ?? "Failed to join class");
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  async function enrollInClass(userId: string, classId: string, orgId: string) {
    // Check if already enrolled
    const { data: existing } = await supabase
      .from("class_enrollments")
      .select("id")
      .eq("class_id", classId)
      .eq("student_id", userId)
      .single();

    if (existing) {
      return { success: true };
    }

    // Enroll
    const { error: enrollError } = await supabase
      .from("class_enrollments")
      .insert({ class_id: classId, student_id: userId });

    if (enrollError) {
      return { success: false, error: "Couldn't join the class. Try again." };
    }

    // Update profile with org_id
    await supabase
      .from("profiles")
      .update({ org_id: orgId })
      .eq("id", userId);

    // Increment invite code usage
    const trimmed = code.trim().toUpperCase();
    await supabase.rpc("increment_invite_usage", { invite_code: trimmed });

    return { success: true };
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
