"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  getOnboardingContext,
  createOrgStub,
  checkSubdomainAvailability,
  saveBranding,
  activateSubscription,
  launchProgram,
  ONBOARDING_STEP,
} from "./actions";

// ─── Types ───

interface FilePreview {
  file: File;
  url: string;
}

interface TierInfo {
  id: "starter" | "growth" | "scale";
  name: string;
  range: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

// ─── Constants ───

const TIERS: TierInfo[] = [
  {
    id: "starter",
    name: "Starter",
    range: "Up to 1,000 students",
    price: 9.99,
    features: [
      "All 22 AI lessons",
      "Scenario simulations",
      "Student progress tracking",
      "Crisis detection",
      "Your branding",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    range: "1,001 - 10,000 students",
    price: 7.99,
    features: [
      "Everything in Starter",
      "Priority support",
      "Advanced analytics",
    ],
    recommended: true,
  },
  {
    id: "scale",
    name: "Scale",
    range: "10,001 - 50,000 students",
    price: 5.99,
    features: [
      "Everything in Growth",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
];

const STEP_LABELS = ["Account", "Program", "Brand", "Plan", "Launch"];

// ─── Helpers ───

function toSubdomain(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

function validateFileUpload(file: File): string | null {
  const MAX_SIZE = 2 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/png", "image/svg+xml"];
  if (!ALLOWED_TYPES.includes(file.type)) return "Only PNG and SVG files are allowed.";
  if (file.size > MAX_SIZE) return "File must be under 2MB.";
  return null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ─── Progress Bar ───

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      {/* Desktop: full labels */}
      <div className="hidden sm:flex items-center justify-between">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const completed = step > stepNum;
          const current = step === stepNum;
          return (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors"
                  style={{
                    background: completed || current ? "var(--primary)" : "var(--bg-muted)",
                    color: completed || current ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {completed ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className="text-xs transition-colors"
                  style={{
                    color: current ? "var(--text-primary)" : "var(--text-muted)",
                    fontWeight: current ? 600 : 400,
                  }}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className="flex-1 h-px mx-2"
                  style={{ background: step > stepNum ? "var(--primary)" : "var(--border)" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: dots + current label */}
      <div className="flex sm:hidden items-center justify-center gap-3">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const completed = step > stepNum;
          const current = step === stepNum;
          return (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className="h-2.5 w-2.5 rounded-full transition-colors"
                style={{
                  background: completed || current ? "var(--primary)" : "var(--border)",
                }}
              />
              {current && (
                <span className="text-[10px] font-semibold text-[var(--text-primary)]">
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───

export default function StartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // ─── State ───
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Auth
  const [user, setUser] = useState<{ id: string; email: string; fullName: string } | null>(null);
  const [authMode, setAuthMode] = useState<"idle" | "google" | "email">("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Step 2: Program
  const [orgName, setOrgName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);

  // Step 3: Brand
  const [logo, setLogo] = useState<FilePreview | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#0D9488");
  const [secondaryColor, setSecondaryColor] = useState("#C084FC");
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Step 4: Plan
  const [selectedTier, setSelectedTier] = useState<"starter" | "growth" | "scale">("growth");
  const [studentCount, setStudentCount] = useState(250);

  // Step 5: Launch
  const [orgId, setOrgId] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [launchConfirming, setLaunchConfirming] = useState(false);

  // ─── On mount: check context ───
  useEffect(() => {
    async function init() {
      const ctx = await getOnboardingContext();

      // Check URL for step param
      const urlStep = searchParams.get("step");
      const sessionId = searchParams.get("session_id");

      if (ctx.user) {
        setUser(ctx.user);
        setFullName(ctx.user.fullName);
        setEmail(ctx.user.email);
      }

      if (ctx.org) {
        setOrgId(ctx.org.id);
        setOrgName(ctx.org.name);
        setSubdomain(ctx.org.subdomain);
        setSubdomainAvailable(true);

        const bc = ctx.org.brandingConfig;
        if (bc.primary_color) setPrimaryColor(bc.primary_color as string);
        if (bc.secondary_color) setSecondaryColor(bc.secondary_color as string);
      }

      if (ctx.inviteCode) setInviteCode(ctx.inviteCode);

      // Determine which step to show
      if (ctx.user && ctx.onboardingStep >= ONBOARDING_STEP.COMPLETE) {
        router.push("/instructor/dashboard");
        return;
      }

      if (sessionId && ctx.user) {
        // Returning from Stripe checkout
        setStep(5);
        setLoading(false);
        handleStripeReturn(sessionId);
        return;
      }

      if (urlStep) {
        const parsed = parseInt(urlStep, 10);
        if (parsed >= 1 && parsed <= 5) {
          // Only allow jumping to step if user has reached it
          if (ctx.user && parsed <= (ctx.onboardingStep ?? 0) + 1) {
            setStep(parsed);
          } else if (!ctx.user && parsed === 1) {
            setStep(1);
          }
        }
      } else if (ctx.user) {
        // Auto-advance to next step
        const nextStep = Math.min((ctx.onboardingStep ?? 0) + 1, 5);
        setStep(nextStep);
      }

      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Cleanup file URLs on unmount ───
  useEffect(() => {
    return () => {
      if (logo) URL.revokeObjectURL(logo.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Auto-derive subdomain from org name ───
  useEffect(() => {
    if (orgName.trim().length >= 2) {
      setSubdomain(toSubdomain(orgName));
    }
  }, [orgName]);

  // ─── Debounced subdomain availability check ───
  useEffect(() => {
    if (subdomain.length < 3) {
      setSubdomainAvailable(null);
      setSubdomainError(null);
      return;
    }

    setSubdomainChecking(true);
    setSubdomainAvailable(null);
    setSubdomainError(null);

    const timer = setTimeout(async () => {
      const result = await checkSubdomainAvailability(subdomain);
      setSubdomainAvailable(result.available);
      setSubdomainError(result.error ?? null);
      setSubdomainChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [subdomain]);

  // ─── Auth: listen for auth state changes (Google OAuth redirect) ───
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user && !user) {
          const u = session.user;
          setUser({
            id: u.id,
            email: u.email ?? "",
            fullName: u.user_metadata?.full_name ?? "",
          });
          // Re-fetch context after sign-in
          const ctx = await getOnboardingContext();
          if (ctx.org) {
            setOrgId(ctx.org.id);
            setOrgName(ctx.org.name);
            setSubdomain(ctx.org.subdomain);
            setSubdomainAvailable(true);
            if (ctx.inviteCode) setInviteCode(ctx.inviteCode);
            const nextStep = Math.min((ctx.onboardingStep ?? 0) + 1, 5);
            setStep(nextStep);
          } else {
            setStep(2);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ─── File handlers ───

  const handleFileSelect = useCallback(
    (file: File) => {
      const err = validateFileUpload(file);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      const url = URL.createObjectURL(file);
      if (logo) URL.revokeObjectURL(logo.url);
      setLogo({ file, url });
    },
    [logo]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  // ─── Step 1: Auth handlers ───

  async function handleGoogleSignIn() {
    setError(null);
    setAuthMode("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth/callback?next=/start",
      },
    });
    if (error) {
      setError(error.message);
      setAuthMode("idle");
    }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email ?? "",
        fullName,
      });
      setStep(2);
    }
    setSubmitting(false);
  }

  // ─── Step 2: Create org ───

  async function handleCreateOrg() {
    setError(null);
    setSubmitting(true);

    const result = await createOrgStub(orgName.trim(), subdomain);

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setOrgId(result.orgId);
    setInviteCode(result.inviteCode);
    setStep(3);
    setSubmitting(false);
  }

  // ─── Step 3: Save branding ───

  async function handleSaveBranding() {
    if (!orgId) return;
    setError(null);
    setSubmitting(true);

    const formData = new FormData();
    formData.set("primaryColor", primaryColor);
    formData.set("secondaryColor", secondaryColor);
    if (logo) formData.set("logo", logo.file);

    const result = await saveBranding(orgId, formData);

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setStep(4);
    setSubmitting(false);
  }

  // ─── Step 4: Stripe checkout ───

  async function handleStartTrial() {
    if (!orgId) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: selectedTier,
          quantity: studentCount,
          orgId,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to create checkout session.");
        setSubmitting(false);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setError("Failed to connect to payment service.");
      setSubmitting(false);
    }
  }

  // ─── Step 5: Handle Stripe return ───

  async function handleStripeReturn(sessionId: string) {
    setSubmitting(true);
    const result = await activateSubscription(sessionId);

    if ("error" in result) {
      setError(result.error);
      setSubscriptionStatus("incomplete");
    } else {
      setSubscriptionStatus(result.status);
    }
    setSubmitting(false);
  }

  // ─── Step 5: Launch ───

  async function handleLaunch() {
    if (!orgId) return;
    setError(null);
    setSubmitting(true);

    const result = await launchProgram(orgId);

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push("/instructor/dashboard");
  }

  // ─── Computed values ───

  const step2Valid =
    orgName.trim().length >= 2 &&
    subdomain.length >= 3 &&
    subdomainAvailable === true;

  const activeTier = TIERS.find((t) => t.id === selectedTier)!;
  const totalPrice = studentCount * activeTier.price;

  // ─── Loading ───

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </main>
    );
  }

  // ─── Render ───

  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl">
        <ProgressBar step={step} />

        {/* ═══════════════════════════════════ */}
        {/* STEP 1: Create Account              */}
        {/* ═══════════════════════════════════ */}
        {step === 1 && (
          <div className="mx-auto max-w-md">
            <div className="text-center">
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
                Start your program
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Setup takes about 3 minutes
              </p>
            </div>

            <div className="mt-8">
              {/* Google sign-in */}
              <button
                onClick={handleGoogleSignIn}
                disabled={authMode === "google"}
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
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
                  <label htmlFor="fullName" className="block text-sm font-medium text-[var(--text-primary)]">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-[var(--border-strong)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="signupEmail" className="block text-sm font-medium text-[var(--text-primary)]">
                    Email
                  </label>
                  <input
                    id="signupEmail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-[var(--border-strong)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                    placeholder="you@school.edu"
                  />
                </div>
                <div>
                  <label htmlFor="signupPassword" className="block text-sm font-medium text-[var(--text-primary)]">
                    Password
                  </label>
                  <input
                    id="signupPassword"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-[var(--border-strong)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                    placeholder="Min. 8 characters"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)] disabled:opacity-50"
                >
                  {submitting ? "Creating account..." : "Create Account"}
                </button>
              </form>

              {/* Trust signal */}
              <p className="mt-6 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-1.5">
                <span aria-hidden="true">&#128274;</span>
                Student data is encrypted and never shared
              </p>

              {/* Sign in link */}
              <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-[var(--primary)] hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 2: Set Up Your Program         */}
        {/* ═══════════════════════════════════ */}
        {step === 2 && (
          <div className="mx-auto max-w-md">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
              Name your program
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              This is how your organization will appear to students
            </p>

            <div className="mt-6 space-y-5">
              {/* Organization name */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Organization Name
                </label>
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

              {/* Subdomain preview */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Your URL
                </label>
                <div className="flex items-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-4 py-3">
                  <span className="font-mono text-sm text-[var(--text-primary)] font-medium">
                    {subdomain || "your-org"}
                  </span>
                  <span className="font-mono text-sm text-[var(--text-muted)]">.adaptable.one</span>
                </div>

                {/* Availability indicator */}
                {subdomain.length >= 3 && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {subdomainChecking ? (
                      <span className="text-xs text-[var(--text-muted)]">Checking...</span>
                    ) : subdomainAvailable === true ? (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
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

                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  You can change this later
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateOrg}
              disabled={!step2Valid || submitting}
              className="mt-8 w-full rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
              style={{ minHeight: 44 }}
            >
              {submitting ? "Creating..." : "Continue"}
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 3: Brand It                    */}
        {/* ═══════════════════════════════════ */}
        {step === 3 && (
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
              Make it yours
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Add your logo and colors. Students will see your brand, not ours.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* LEFT: Form */}
              <div className="space-y-5">
                {/* Logo upload */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Logo
                  </label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-8 cursor-pointer hover:border-[var(--primary)]/40 transition-colors"
                  >
                    {logo ? (
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logo.url} alt="Logo preview" className="h-12 w-12 object-contain rounded" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{logo.file.name}</p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              URL.revokeObjectURL(logo.url);
                              setLogo(null);
                            }}
                            className="text-xs text-[var(--error)] hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--text-muted)]">
                        Drop your logo here, or{" "}
                        <span className="text-[var(--primary)] font-medium">browse</span>
                      </p>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                    }}
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    <p className="text-xs text-[var(--text-muted)]">PNG or SVG, max 2MB</p>
                    {!logo && (
                      <button
                        type="button"
                        onClick={() => {/* no-op, just continue without logo */}}
                        className="text-xs text-[var(--primary)] hover:underline"
                      >
                        Skip
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary color */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded-lg border border-[var(--border)] p-0.5"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setPrimaryColor(v);
                      }}
                      maxLength={7}
                      className="w-24 font-mono text-sm rounded-lg border border-[var(--border-strong)] px-3 py-2 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                    />
                  </div>
                </div>

                {/* Secondary color */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded-lg border border-[var(--border)] p-0.5"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setSecondaryColor(v);
                      }}
                      maxLength={7}
                      className="w-24 font-mono text-sm rounded-lg border border-[var(--border-strong)] px-3 py-2 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT: Live Preview */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Preview
                </label>
                <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
                  {/* Navbar */}
                  <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: primaryColor }}>
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo.url} alt="" className="h-6 w-6 object-contain rounded" />
                    ) : (
                      <div className="h-6 w-6 rounded bg-white/20" />
                    )}
                    <span className="text-sm font-semibold text-white truncate">
                      {orgName || "Your Organization"}
                    </span>
                    <div className="ml-auto flex gap-3">
                      {["Lessons", "Scenarios", "Guide"].map((item) => (
                        <span key={item} className="text-xs text-white/70 hidden sm:inline">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Content area */}
                  <div className="bg-white px-4 py-5">
                    <div className="rounded-lg border border-[var(--border)] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        {logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logo.url} alt="" className="h-5 w-5 object-contain rounded" />
                        ) : (
                          <div className="h-5 w-5 rounded bg-gray-200" />
                        )}
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {orgName || "Your Organization"}
                        </span>
                      </div>
                      <div className="h-2 w-32 rounded bg-gray-200" />
                      <div className="mt-2 h-2 w-48 rounded bg-gray-100" />
                      <button
                        type="button"
                        className="mt-3 rounded-md px-3 py-1.5 text-xs font-medium text-white"
                        style={{ background: secondaryColor }}
                      >
                        Start Lesson
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                style={{ minHeight: 44 }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveBranding}
                disabled={submitting}
                className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
                style={{ minHeight: 44 }}
              >
                {submitting ? "Saving..." : "Continue"}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 4: Choose Your Plan            */}
        {/* ═══════════════════════════════════ */}
        {step === 4 && (
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
              Choose your plan
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Every plan includes all features. Pick based on your program size.
            </p>

            {/* Tier cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TIERS.map((tier) => {
                const isSelected = selectedTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedTier(tier.id)}
                    className="relative rounded-xl border-2 p-5 text-left transition-all"
                    style={{
                      borderColor: isSelected ? "var(--primary)" : "var(--border)",
                      background: isSelected ? "var(--primary)" + "08" : "var(--bg)",
                    }}
                  >
                    {tier.recommended && (
                      <span
                        className="absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white"
                        style={{ background: "var(--primary)" }}
                      >
                        Recommended
                      </span>
                    )}
                    <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
                      {tier.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{tier.range}</p>
                    <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">
                      ${tier.price}
                      <span className="text-sm font-normal text-[var(--text-muted)]">/student/year</span>
                    </p>
                    <ul className="mt-4 space-y-2">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                          <svg
                            className="h-4 w-4 shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                            style={{ color: isSelected ? "var(--primary)" : "var(--text-muted)" }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {/* Student count + total */}
            <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-5">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                How many students?
              </label>
              <input
                type="number"
                min={1}
                max={50000}
                value={studentCount}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 0) setStudentCount(Math.min(v, 50000));
                }}
                className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 font-mono"
              />
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                <span className="font-mono">{studentCount.toLocaleString()}</span> students{" "}
                <span className="text-[var(--text-muted)]">x</span>{" "}
                <span className="font-mono">${activeTier.price}</span>{" "}
                <span className="text-[var(--text-muted)]">=</span>{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  {formatCurrency(totalPrice)}/year
                </span>
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                style={{ minHeight: 44 }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleStartTrial}
                disabled={submitting || studentCount < 1}
                className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
                style={{ minHeight: 48 }}
              >
                {submitting ? "Redirecting to checkout..." : "Start 14-day free trial"}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 5: Launchpad                   */}
        {/* ═══════════════════════════════════ */}
        {step === 5 && (
          <div className="mx-auto max-w-lg">
            {/* Loading / verifying payment */}
            {submitting && (
              <div className="text-center py-12">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
                <p className="mt-4 text-sm text-[var(--text-secondary)]">
                  Verifying your payment...
                </p>
              </div>
            )}

            {/* Incomplete payment */}
            {!submitting && subscriptionStatus === "incomplete" && (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)]">
                  Additional verification needed
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Your bank requires additional verification. Check your email from Stripe.
                </p>
                {error && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Launchpad */}
            {!submitting && subscriptionStatus !== "incomplete" && (
              <>
                <div className="text-center">
                  <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
                    Your program is ready
                  </h1>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Preview everything before going live. Students won&apos;t see anything until you launch.
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  {/* Card 1: Preview */}
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          Preview student experience
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          See what students will see when they join
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewExpanded(!previewExpanded)}
                        className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                        style={{ minHeight: 32 }}
                      >
                        {previewExpanded ? "Hide" : "Preview"}
                      </button>
                    </div>

                    {previewExpanded && (
                      <div className="mt-4 rounded-lg border border-[var(--border)] overflow-hidden">
                        {/* Mini navbar */}
                        <div className="flex items-center gap-2 px-3 py-2" style={{ background: primaryColor }}>
                          {logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={logo.url} alt="" className="h-5 w-5 object-contain rounded" />
                          ) : (
                            <div className="h-5 w-5 rounded bg-white/20" />
                          )}
                          <span className="text-xs font-semibold text-white truncate">
                            {orgName || "Your Organization"}
                          </span>
                        </div>
                        {/* Mini dashboard */}
                        <div className="bg-[var(--bg-subtle)] p-4">
                          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">
                            Welcome to {orgName || "your program"}
                          </p>
                          <div className="space-y-2">
                            <div className="rounded-lg bg-white border border-[var(--border)] p-3">
                              <div className="h-2 w-20 rounded bg-gray-200" />
                              <div className="mt-1.5 h-1.5 w-32 rounded bg-gray-100" />
                            </div>
                            <div className="rounded-lg bg-white border border-[var(--border)] p-3">
                              <div className="h-2 w-16 rounded bg-gray-200" />
                              <div className="mt-1.5 h-1.5 w-28 rounded bg-gray-100" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card 2: Invite code */}
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Your invite code
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Share this code with your students. They&apos;ll enter it at{" "}
                      <span className="font-mono font-medium">{subdomain}.adaptable.one/go</span>
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <code className="flex-1 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] px-4 py-3 font-mono text-xl font-bold text-[var(--text-primary)] tracking-wider text-center">
                        {inviteCode || "---"}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          if (inviteCode) {
                            navigator.clipboard.writeText(inviteCode);
                            setCodeCopied(true);
                            setTimeout(() => setCodeCopied(false), 2000);
                          }
                        }}
                        className="rounded-lg border border-[var(--border-strong)] px-3 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors shrink-0"
                        style={{ minHeight: 44 }}
                      >
                        {codeCopied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Card 3: Invite team */}
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Invite your team
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Coming soon. You can manage your team from the dashboard.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--error)]">
                    {error}
                  </div>
                )}

                {/* Launch confirmation */}
                {!launchConfirming ? (
                  <button
                    type="button"
                    onClick={() => setLaunchConfirming(true)}
                    className="mt-8 w-full rounded-lg bg-[var(--primary)] px-4 py-4 text-base font-semibold text-white transition-colors hover:bg-[var(--primary-dark)]"
                    style={{ minHeight: 48 }}
                  >
                    Launch Program
                  </button>
                ) : (
                  <div className="mt-8 rounded-xl border-2 border-[var(--primary)] bg-[var(--primary)]/5 p-5">
                    <p className="text-sm text-[var(--text-secondary)]">
                      Once you launch, students can access your program at{" "}
                      <span className="font-mono font-semibold text-[var(--text-primary)]">
                        {subdomain}.adaptable.one
                      </span>
                    </p>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setLaunchConfirming(false)}
                        className="rounded-lg border border-[var(--border-strong)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                        style={{ minHeight: 44 }}
                      >
                        Not yet
                      </button>
                      <button
                        type="button"
                        onClick={handleLaunch}
                        disabled={submitting}
                        className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
                        style={{ minHeight: 44 }}
                      >
                        {submitting ? "Launching..." : "Yes, launch now"}
                      </button>
                    </div>
                  </div>
                )}

                <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
                  Need help?{" "}
                  <a
                    href="https://calendly.com/adaptable/setup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--primary)] hover:underline"
                  >
                    Book a 15-minute setup call
                  </a>
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
