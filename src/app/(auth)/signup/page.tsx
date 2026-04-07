"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

function computeAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const age = computeAge(dob);
  const isUnder13 = age !== null && age < 13;
  const isUnder18 = age !== null && age < 18;
  const tooYoung = age !== null && age < 12; // hard floor

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Hard age floor: 12+
    if (tooYoung) {
      setError("Adaptable is for students age 12 and older. If you're younger, please come back when you're 12.");
      return;
    }

    // Under-13s require a parent email for COPPA-verifiable consent
    if (isUnder13 && !parentEmail) {
      setError("Because you're under 13, we need a parent or guardian's email to send a consent request.");
      return;
    }

    setLoading(true);

    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    // Save DOB + initial consent state on the profile
    if (authData.user) {
      const consentStatus = isUnder13 ? "pending_parental" : "not_required";
      await supabase
        .from("profiles")
        .update({
          date_of_birth: dob,
          consent_status: consentStatus,
        })
        .eq("id", authData.user.id);

      // For under-13s, kick off the parental consent email flow.
      // (Server-side; the action checks rate limits and handles the email send.)
      if (isUnder13 && parentEmail) {
        try {
          const { startParentalConsent } = await import("@/lib/parental-consent");
          await startParentalConsent(authData.user.id, parentEmail);
        } catch (e) {
          console.error("[signup] parental consent kickoff failed", e);
          // Don't block signup — they can retry from the dashboard
        }
      }
    }

    // Check for pending class enrollment from the join flow
    try {
      const pendingJoin = sessionStorage.getItem("pendingClassJoin");
      const pendingCode = sessionStorage.getItem("pendingInviteCode");
      if (pendingJoin && pendingCode) {
        const { completeClassEnrollment } = await import("@/app/(auth)/join/actions");
        const classInfo = JSON.parse(pendingJoin);
        await completeClassEnrollment(classInfo.classId, classInfo.orgId, pendingCode);
        sessionStorage.removeItem("pendingClassJoin");
        sessionStorage.removeItem("pendingInviteCode");
      }
    } catch {
      // Enrollment will need to be done manually — don't block onboarding
    }

    // Under-13s land on a "waiting for parent" page; everyone else goes to onboarding.
    router.push(isUnder13 ? "/parental-consent-pending" : "/onboarding");
  }

  async function handleGoogleSignup() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-center">
          Create your account
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
          Design your venture. Launch when you're ready.
        </p>

        <div className="mt-8">
          <button
            onClick={handleGoogleSignup}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--bg-muted)]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--bg)] px-2 text-[var(--text-muted)]">
                or create with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--text-primary)]">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)]">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                placeholder="you@school.edu"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--text-primary)]">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-[var(--text-primary)]">
                Date of birth
              </label>
              <input
                id="dob"
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="mt-1 block w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                We need this to make sure Adaptable is right for you. Adaptable is for ages 12+.
              </p>
            </div>

            {isUnder13 && !tooYoung && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                <p className="text-xs font-semibold text-amber-900">A parent or guardian needs to say yes</p>
                <p className="mt-1 text-xs text-amber-800">
                  Because you&apos;re under 13, we need to send a quick approval request to a parent or guardian.
                  They&apos;ll get an email with a link.
                </p>
                <input
                  id="parent_email"
                  type="email"
                  required={isUnder13}
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="mt-3 block w-full rounded-lg border border-amber-300 px-3 py-2 text-sm outline-none transition-colors focus:border-amber-600 focus:ring-2 focus:ring-amber-500/15"
                  placeholder="parent@example.com"
                />
              </div>
            )}

            {tooYoung && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-900">
                Adaptable is for students age 12 and older. Come back when you&apos;re 12!
              </div>
            )}

            {age !== null && isUnder18 && !isUnder13 && (
              <p className="text-xs text-[var(--text-muted)]">
                Your account is good to go. We&apos;ll let you know if anything in your activity needs a parent&apos;s eye.
              </p>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || tooYoung}
              className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
