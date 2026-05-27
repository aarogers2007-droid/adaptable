"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getOnboardingContext,
  createOrgStub,
  checkSubdomainAvailability,
  saveBranding,
  launchProgram,
} from "./actions";
import { activateSubscription } from "./stripe-actions";
import { ONBOARDING_STEP } from "./constants";

// ─── Types ───

interface FilePreview {
  file: File;
  url: string;
}

// ─── Constants ───

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

function toSubdomain(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
}

function validateFileUpload(file: File): string | null {
  const MAX_SIZE = 2 * 1024 * 1024;
  const ALLOWED_TYPES = ["image/png", "image/svg+xml", "image/jpeg"];
  if (!ALLOWED_TYPES.includes(file.type)) return "Only PNG, JPG, or SVG files are allowed.";
  if (file.size > MAX_SIZE) return "File must be under 2MB.";
  return null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);
}

const STEP_LABELS = ["Account", "Program", "Brand", "Pricing", "Launch"];

const ANIMATION_STYLES = `
@keyframes stepFadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.step-enter {
  animation: stepFadeIn 350ms ease-out both;
}
`;

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const completed = step > stepNum;
          const current = step === stepNum;
          return (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    background: completed || current ? "var(--primary)" : "var(--bg-muted)",
                    color: completed || current ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {stepNum}
                </div>
                <span className="text-xs" style={{ color: current ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className="flex-1 h-[2px] rounded-full mx-2" style={{ background: step > stepNum ? "var(--primary)" : "var(--border)" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StartPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

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

  // Step 2
  const [orgName, setOrgName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);

  // Step 3
  const [logo, setLogo] = useState<FilePreview | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#0D9488");
  const [secondaryColor, setSecondaryColor] = useState("#F59E0B");
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Step 4
  const [studentCount, setStudentCount] = useState(250);
  const [studentCountInput, setStudentCountInput] = useState("250");

  // Step 5
  const [orgId, setOrgId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [launchConfirming, setLaunchConfirming] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);

  function goToStep(n: number) {
    setError(null);
    setSubmitting(false);
    setStep(n);
  }

  useEffect(() => {
    async function init() {
      try {
        const ctx = await getOnboardingContext();
        if (ctx.user && ctx.onboardingStep >= ONBOARDING_STEP.COMPLETE) {
          router.push("/instructor/dashboard");
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect 1: logo cleanup
  useEffect(() => {
    return () => { if (logo) URL.revokeObjectURL(logo.url); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effects 2 and 3 disabled for layer testing

  // ─── Handlers ───

  const handleFileSelect = useCallback((file: File) => {
    const err = validateFileUpload(file);
    if (err) { setError(err); return; }
    setError(null);
    const url = URL.createObjectURL(file);
    if (logo) URL.revokeObjectURL(logo.url);
    setLogo({ file, url });
  }, [logo]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  async function handleGoogleSignIn() {
    setError(null); setAuthMode("google");
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/auth/callback?next=/start" } });
    if (oauthErr) { setError(oauthErr.message); setAuthMode("idle"); }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    const trimmedName = fullName.trim();
    if (!trimmedName) { setError("Please enter your name."); return; }
    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: trimmedName } } });
    if (signUpError) { setError(signUpError.message); setSubmitting(false); return; }
    if (data.user) { setUser({ id: data.user.id, email: data.user.email ?? "", fullName: trimmedName }); goToStep(2); }
    setSubmitting(false);
  }

  async function handleCreateOrg() {
    setError(null); setSubmitting(true);
    const result = await createOrgStub(orgName.trim(), subdomain);
    if ("error" in result) { setError(result.error); setSubmitting(false); return; }
    setOrgId(result.orgId); goToStep(3);
  }

  async function handleSaveBranding() {
    if (!orgId) return; setError(null); setSubmitting(true);
    const formData = new FormData();
    formData.set("primaryColor", primaryColor); formData.set("secondaryColor", secondaryColor);
    if (logo) formData.set("logo", logo.file);
    const result = await saveBranding(orgId, formData);
    if ("error" in result) { setError(result.error); setSubmitting(false); return; }
    goToStep(4);
  }

  async function handleContinueToPayment() {
    if (!orgId) return; setError(null); setSubmitting(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: studentCount, orgId }) });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || "Failed to create checkout session."); setSubmitting(false); return; }
      window.location.href = data.url;
    } catch { setError("Failed to connect to payment service."); setSubmitting(false); }
  }

  async function handleStripeReturn(sessionId: string) {
    setSubmitting(true);
    const result = await activateSubscription(sessionId);
    if ("error" in result) { setError(result.error); setSubscriptionStatus("incomplete"); } else { setSubscriptionStatus(result.status); }
    setSubmitting(false);
  }

  async function handleLaunch() {
    if (!orgId) return; setError(null); setSubmitting(true);
    const result = await launchProgram(orgId);
    if ("error" in result) { setError(result.error); setSubmitting(false); return; }
    try { router.push("/instructor/dashboard"); } catch { setSubmitting(false); }
  }

  const step2Valid = orgName.trim().length >= 2 && subdomain.length >= 3 && subdomainAvailable === true;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-12 sm:py-20">
      <style dangerouslySetInnerHTML={{ __html: ANIMATION_STYLES }} />
      <div className="w-full max-w-2xl">
        <ProgressBar step={step} />

        {step === 1 && (
          <div className="mx-auto max-w-md step-enter">
            <h1 className="text-2xl font-bold text-center">Start your program</h1>
            <p className="mt-2 text-sm text-center text-gray-500">Setup takes about 3 minutes</p>
            {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
            <p className="mt-8 text-sm text-gray-400 text-center">
              Layer 4c: State declarations only. User: {user ? "yes" : "no"}, Org: {orgId ?? "none"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </main>
    }>
      <StartPageInner />
    </Suspense>
  );
}
