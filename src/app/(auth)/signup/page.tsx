"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBranding } from "@/components/BrandingProvider";

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
  const branding = useBranding();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const age = computeAge(dob);
  const isUnder18 = age !== null && age < 18;

  // Invention mode uses a different COPPA threshold (under 11) and age floor (11)
  // Curriculum mode keeps the existing thresholds (under 13, floor 12)
  function isInventionMode(): boolean {
    try {
      const pending = sessionStorage.getItem("pendingClassJoin");
      if (!pending) return false;
      return JSON.parse(pending).sessionType === "invention";
    } catch { return false; }
  }

  const inventionMode = isInventionMode();
  const consentAge = inventionMode ? 11 : 13;
  const ageFloor = inventionMode ? 11 : 12;
  const needsConsent = age !== null && age < consentAge;
  const tooYoung = age !== null && age < ageFloor;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (tooYoung) {
      setError(inventionMode
        ? "This event is for students age 11 and older."
        : `${branding.platform_name} is for students age 12 and older. If you're younger, please come back when you're 12!`);
      return;
    }

    // Parental consent required for students under the threshold
    if (needsConsent && !parentEmail) {
      setError(`Because you're under ${consentAge}, we need a parent or guardian's email to send a consent request.`);
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
      const consentStatus = needsConsent ? "pending_parental" : "not_required";
      await supabase
        .from("profiles")
        .update({
          date_of_birth: dob,
          consent_status: consentStatus,
          org_id: "00000000-0000-0000-0000-000000000001",
        })
        .eq("id", authData.user.id);

      // For under-13s, kick off the parental consent email flow.
      // (Server-side; the action checks rate limits and handles the email send.)
      if (needsConsent && parentEmail) {
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

    // Determine destination based on session type
    let destination = "/onboarding";
    try {
      const pending = sessionStorage.getItem("pendingClassJoin");
      if (pending) {
        const info = JSON.parse(pending);
        if (info.sessionType === "invention") destination = "/invention";
      }
    } catch { /* fall through to default */ }

    // Under-13s: show age gate error instead of redirecting to deleted consent page.
    if (needsConsent) {
      setError("This program is for students age 13 and older.");
      setLoading(false);
      return;
    }
    // Full page navigation (not client-side) ensures the auth cookie is
    // fully set before the server component reads it. router.push() can
    // race the cookie, causing React error #310 on /onboarding.
    window.location.href = destination;
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
        {branding.logo_url && (
          <div className="flex justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={branding.logo_url} alt={branding.platform_name} className="h-12 w-auto object-contain" />
          </div>
        )}
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-center">
          {branding.platform_name !== "Adaptable" ? `Join ${branding.platform_name}` : "Create your account"}
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--text-secondary)]">
          {branding.platform_name !== "Adaptable" ? "Create your account to get started." : "Design your venture. Launch when you're ready."}
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
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 pr-11 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
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
                We need this to make sure {branding.platform_name} is right for you. {branding.platform_name} is for ages 12+.
              </p>
            </div>

            {needsConsent && !tooYoung && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                <p className="text-xs font-semibold text-amber-900">A parent or guardian needs to say yes</p>
                <p className="mt-1 text-xs text-amber-800">
                  Because you&apos;re under {consentAge}, we need to send a quick approval request to a parent or guardian.
                  They&apos;ll get an email with a link.
                </p>
                <input
                  id="parent_email"
                  type="email"
                  required={needsConsent}
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="mt-3 block w-full rounded-lg border border-amber-300 px-3 py-2 text-sm outline-none transition-colors focus:border-amber-600 focus:ring-2 focus:ring-amber-500/15"
                  placeholder="parent@example.com"
                />
              </div>
            )}

            {tooYoung && (
              <div className="rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-3 text-xs text-red-900">
                {branding.platform_name} is for students age 12 and older. Come back when you&apos;re 12!
              </div>
            )}

            {age !== null && isUnder18 && !needsConsent && (
              <p className="text-xs text-[var(--text-muted)]">
                Your account is good to go. We&apos;ll let you know if anything in your activity needs a parent&apos;s eye.
              </p>
            )}

            {error && (
              <div className="rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]">
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
