"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Step1Props {
  onSignedUp: (user: { id: string; email: string; fullName: string }) => void;
  error: string | null;
  setError: (e: string | null) => void;
}

export default function Step1Auth({ onSignedUp, error, setError }: Step1Props) {
  const supabase = createClient();
  const [authMode, setAuthMode] = useState<"idle" | "google" | "email">("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setAuthMode("google");
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback?next=/start" },
    });
    if (oauthErr) { setError(oauthErr.message); setAuthMode("idle"); }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = fullName.trim();
    if (!trimmedName) { setError("Please enter your name."); return; }
    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: trimmedName } },
    });
    if (signUpError) { setError(signUpError.message); setSubmitting(false); return; }
    if (data.user) {
      onSignedUp({ id: data.user.id, email: data.user.email ?? "", fullName: trimmedName });
    }
    setSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-md step-enter">
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-display)] text-[32px] leading-[1.2] font-semibold text-[var(--text-primary)]">
          Start your program
        </h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Setup takes about 3 minutes
        </p>
      </div>

      <div className="mt-8">
        {/* Google sign-in */}
        <button
          onClick={handleGoogleSignIn}
          disabled={authMode === "google"}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--primary-dark)] disabled:opacity-50"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)" }}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#fff" fillOpacity={0.8} />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" fillOpacity={0.9} />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" fillOpacity={0.7} />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" fillOpacity={0.85} />
          </svg>
          {authMode === "google" ? "Redirecting..." : "Continue with Google"}
        </button>

        {/* Divider */}
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[var(--bg)] px-2 text-[var(--text-muted)]">or</span>
          </div>
        </div>

        {/* Email sign-up form */}
        <form onSubmit={handleEmailSignUp} className="mt-6 space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-[var(--text-primary)]">Full name</label>
            <input id="fullName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
              placeholder="Your name" />
          </div>
          <div>
            <label htmlFor="signupEmail" className="block text-sm font-medium text-[var(--text-primary)]">Email</label>
            <input id="signupEmail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
              placeholder="you@organization.org" />
          </div>
          <div>
            <label htmlFor="signupPassword" className="block text-sm font-medium text-[var(--text-primary)]">Password</label>
            <input id="signupPassword" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
              placeholder="Min. 8 characters" />
          </div>

          {error && (
            <div className="rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting}
            className="w-full rounded-lg bg-[#111827] text-white hover:bg-[#1f2937] border-none px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50">
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-1.5">
          <span aria-hidden="true">&#128274;</span>
          Student data is encrypted and never shared
        </p>

        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
