"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
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
  uploadCurriculumFiles,
  approveDraftLessons,
  skipCurriculum,
  getDraftLessons,
} from "./actions";
import { ONBOARDING_STEP } from "./constants";

// ─── Types ───

interface FilePreview {
  file: File;
  url: string;
}

// ─── Constants ───

// Volume-based pricing — all features included at every level.
// Price drops as student count increases. No gated features.
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
  return 5.99; // 50,000+ floor
}


const STEP_LABELS = ["Account", "Program", "Brand", "Pricing", "Curriculum", "Launch"];

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
  const ALLOWED_TYPES = ["image/png", "image/svg+xml", "image/jpeg"];
  if (!ALLOWED_TYPES.includes(file.type)) return "Only PNG, JPG, or SVG files are allowed.";
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

// ─── Premium Animation Styles (CSS-only, Chromebook-safe) ───

const ANIMATION_STYLES = `
@keyframes stepFadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes stepFadeOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-8px); }
}
@keyframes staggerChild {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes progressFill {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@keyframes summaryReveal {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}
.step-enter {
  animation: stepFadeIn 350ms ease-out both;
}
.step-enter > * {
  animation: staggerChild 300ms ease-out both;
}
.step-enter > *:nth-child(1) { animation-delay: 60ms; }
.step-enter > *:nth-child(2) { animation-delay: 120ms; }
.step-enter > *:nth-child(3) { animation-delay: 180ms; }
.step-enter > *:nth-child(4) { animation-delay: 240ms; }
.step-enter > *:nth-child(5) { animation-delay: 300ms; }
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
.summary-enter {
  animation: summaryReveal 500ms ease-out both;
  animation-delay: 150ms;
}
input[type="color"] {
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}
input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 3px;
}
input[type="color"]::-webkit-color-swatch {
  border-radius: 6px;
  border: none;
}
@media (prefers-reduced-motion: reduce) {
  .step-enter, .step-enter > *, .summary-enter {
    animation: none !important;
  }
}
`;

function ProgressBar({ step, onStepClick }: { step: number; onStepClick?: (s: number) => void }) {
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
              <button
                type="button"
                className="flex items-center gap-2 shrink-0"
                style={{ cursor: completed ? "pointer" : "default" }}
                onClick={() => completed && onStepClick?.(stepNum)}
                disabled={!completed}
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    background: completed || current ? "var(--primary)" : "var(--bg-muted)",
                    color: completed || current ? "#fff" : "var(--text-muted)",
                    transition: "background 500ms ease-out, color 500ms ease-out",
                  }}
                >
                  {completed ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
              </button>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className="flex-1 h-[2px] rounded-full mx-2"
                  style={{
                    background: step > stepNum ? "var(--primary)" : "var(--border)",
                    transition: "background 500ms ease-out",
                  }}
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
            <button
              key={label}
              type="button"
              className="flex flex-col items-center gap-1"
              style={{ cursor: completed ? "pointer" : "default" }}
              onClick={() => completed && onStepClick?.(stepNum)}
              disabled={!completed}
            >
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
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───

function StartPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // ─── State ───
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Welcome modal
  const [showWelcome, setShowWelcome] = useState(false);

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
  const [secondaryColor, setSecondaryColor] = useState("#F59E0B");
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Step 4: Plan
  // selectedTier removed — pricing is now volume-based, tier auto-detected from student count
  const [studentCount, setStudentCount] = useState(250);
  const [studentCountInput, setStudentCountInput] = useState("250");

  // Step 5: Curriculum
  const [ipConsent, setIpConsent] = useState(false);
  const [curriculumFiles, setCurriculumFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [processMessage, setProcessMessage] = useState("");
  const [draftLessons, setDraftLessons] = useState<Array<{
    id: string;
    title: string;
    objective: string;
    module_name: string;
    module_sequence: number;
    lesson_sequence: number;
    status: string;
  }>>([]);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [lessonEdits, setLessonEdits] = useState<Record<string, { title?: string; objective?: string }>>({});

  // Step 6: Launch
  const [orgId, setOrgId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [launchConfirming, setLaunchConfirming] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);

  // ─── Step navigation helper (clears stale error/submitting state) ───
  function goToStep(n: number) {
    setError(null);
    setSubmitting(false);
    setStep(n);
  }

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

      // Determine which step to show
      if (ctx.user && ctx.onboardingStep >= ONBOARDING_STEP.COMPLETE) {
        router.push("/instructor/dashboard");
        return;
      }

      if (sessionId && ctx.user) {
        // Returning from Stripe checkout — activate subscription, then go to curriculum step
        setStep(5);
        setLoading(false);
        handleStripeReturn(sessionId);
        return;
      }

      if (urlStep) {
        const parsed = parseInt(urlStep, 10);
        if (parsed >= 1 && parsed <= 7) {
          // Only allow jumping to step if user has reached it
          if (ctx.user && parsed <= (ctx.onboardingStep ?? 0) + 1) {
            setStep(parsed);
          } else if (!ctx.user && parsed === 1) {
            setStep(1);
          }
        }
      } else if (ctx.user) {
        // Auto-advance to next step
        const nextStep = Math.min((ctx.onboardingStep ?? 0) + 1, 6);
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
          setEmail("");
          setPassword("");
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
            const nextStep = Math.min((ctx.onboardingStep ?? 0) + 1, 6);
            goToStep(nextStep);
          } else {
            setShowWelcome(true);
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

    const trimmedName = fullName.trim();
    if (!trimmedName) { setError("Please enter your name."); return; }

    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: trimmedName },
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
        fullName: trimmedName,
      });
      goToStep(2);
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
    goToStep(3);
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

    goToStep(4);
  }

  // ─── Step 4: Stripe checkout ───

  async function handleContinueToPayment() {
    if (!orgId) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

  // ─── Step 6: Handle Stripe return ───

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

  // ─── Step 6: Launch ───

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

    try {
      router.push("/instructor/dashboard");
    } catch {
      setSubmitting(false);
    }
  }

  // ─── Step 5: Curriculum handlers ───

  const curriculumFileInputRef = useRef<HTMLInputElement>(null);

  async function handleCurriculumUpload() {
    if (!orgId || !ipConsent || curriculumFiles.length === 0) return;
    setError(null);
    setProcessing(true);
    setProcessProgress(0);
    setProcessMessage("Uploading files...");

    try {
      const formData = new FormData();
      curriculumFiles.forEach((f) => formData.append("files", f));

      const uploadResult = await uploadCurriculumFiles(orgId, formData);

      if ("error" in uploadResult) {
        setError(uploadResult.error);
        setProcessing(false);
        return;
      }

      // Start SSE connection for processing progress
      setProcessMessage("Analyzing curriculum...");
      const eventSource = new EventSource(`/api/curriculum/process?orgId=${orgId}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.progress !== undefined) setProcessProgress(data.progress);
          if (data.message) setProcessMessage(data.message);

          if (data.status === "complete") {
            eventSource.close();
            // Fetch generated lessons
            getDraftLessons(orgId).then((lessons) => {
              setDraftLessons(lessons.map((l) => ({
                ...l,
                objective: l.objective ?? "",
                module_name: l.module_name ?? "Module",
                module_sequence: l.module_sequence ?? 0,
                lesson_sequence: l.lesson_sequence ?? 0,
              })));
              setProcessing(false);
            });
          }

          if (data.status === "error") {
            eventSource.close();
            setError(data.message || "Processing failed. Please try again.");
            setProcessing(false);
          }
        } catch {
          // ignore parse errors on partial chunks
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setError("Connection lost during processing. Please try again.");
        setProcessing(false);
      };
    } catch {
      setError("Failed to upload curriculum files.");
      setProcessing(false);
    }
  }

  async function handleApproveLessons() {
    if (!orgId) return;
    setError(null);
    setSubmitting(true);

    const approvedIds = draftLessons
      .filter((l) => l.status !== "rejected")
      .map((l) => l.id);

    const result = await approveDraftLessons(orgId, approvedIds, lessonEdits);

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    goToStep(6);
  }

  async function handleSkipCurriculum() {
    if (!orgId) return;
    setError(null);
    setSubmitting(true);

    const result = await skipCurriculum(orgId);

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    goToStep(6);
  }

  function handleCurriculumDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      [".pdf", ".docx", ".pptx", ".txt"].some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    setCurriculumFiles((prev) => [...prev, ...files]);
  }

  function removeCurriculumFile(index: number) {
    setCurriculumFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleLessonRemove(lessonId: string) {
    setDraftLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? { ...l, status: l.status === "rejected" ? "draft" : "rejected" }
          : l
      )
    );
  }

  function saveLessonEdit(lessonId: string) {
    setEditingLesson(null);
  }

  // Group draft lessons by module for rendering
  const curriculumModules = draftLessons.length > 0
    ? Object.values(
        draftLessons.reduce((acc, lesson) => {
          const key = lesson.module_name;
          if (!acc[key]) {
            acc[key] = {
              name: lesson.module_name,
              sequence: lesson.module_sequence,
              lessons: [],
            };
          }
          acc[key].lessons.push(lesson);
          return acc;
        }, {} as Record<string, { name: string; sequence: number; lessons: typeof draftLessons }>)
      )
        .sort((a, b) => a.sequence - b.sequence)
        .map((mod) => ({
          ...mod,
          lessons: mod.lessons.sort((a, b) => a.lesson_sequence - b.lesson_sequence),
        }))
    : [];

  // ─── Computed values ───

  const step2Valid =
    orgName.trim().length >= 2 &&
    subdomain.length >= 3 &&
    subdomainAvailable === true;

  // Stripe handles volume pricing natively — single price ID, tiers configured in Stripe Dashboard.
  // getPriceForCount() mirrors the same tiers for display purposes only.

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
    <main className="flex min-h-screen items-start justify-center px-4 py-12 sm:py-20">
      <style dangerouslySetInnerHTML={{ __html: ANIMATION_STYLES }} />
      <div className="w-full max-w-2xl">
        <ProgressBar step={step} onStepClick={goToStep} />

        {/* ═══════════════════════════════════ */}
        {/* Welcome Modal                       */}
        {/* ═══════════════════════════════════ */}
        {showWelcome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" style={{ animation: "fadeIn 300ms ease" }}>
            <div
              className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
              style={{ animation: "scaleIn 350ms cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)]/10">
                  <svg className="h-7 w-7 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </div>
                <h2 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
                  Welcome to Adaptable
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                  You upload your curriculum. We turn it into AI-guided lessons your students interact with one-on-one. Every student gets a personalized experience with your content, your branding, your name on it.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 rounded-lg bg-[var(--bg-subtle)] p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">1</span>
                  <p className="text-sm text-[var(--text-secondary)]"><span className="font-medium text-[var(--text-primary)]">You bring the content.</span> Upload your existing curriculum files.</p>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-[var(--bg-subtle)] p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">2</span>
                  <p className="text-sm text-[var(--text-secondary)]"><span className="font-medium text-[var(--text-primary)]">We build the lessons.</span> AI creates interactive lessons from your materials.</p>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-[var(--bg-subtle)] p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">3</span>
                  <p className="text-sm text-[var(--text-secondary)]"><span className="font-medium text-[var(--text-primary)]">Students learn by doing.</span> Each student gets a 1-on-1 AI mentor guided by your curriculum.</p>
                </div>
              </div>

              <button
                onClick={() => { setShowWelcome(false); goToStep(2); }}
                className="mt-8 w-full rounded-lg bg-[var(--primary)] px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[var(--primary-dark)]"
                style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)" }}
              >
                Let&apos;s get started
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 1: Create Account              */}
        {/* ═══════════════════════════════════ */}
        {step === 1 && (
          <div key="step1" className="mx-auto max-w-md step-enter">
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
                  <label htmlFor="fullName" className="block text-sm font-medium text-[var(--text-primary)]">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
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
                    className="mt-1 block w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
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
                    className="mt-1 block w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                    placeholder="Min. 8 characters"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-[#111827] text-white hover:bg-[#1f2937] border-none px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
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
          <div key="step2" className="mx-auto max-w-md step-enter">
            <h1 className="font-[family-name:var(--font-display)] text-[32px] leading-[1.2] font-semibold text-[var(--text-primary)]">
              Name your program
            </h1>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
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

              {/* Program URL */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Choose your program link
                </label>
                <p className="text-xs text-[var(--text-muted)] mb-2">
                  This is the link you&apos;ll share with students and staff to access your program. Pick a short word like &quot;learn&quot;, &quot;start&quot;, or &quot;app&quot;.
                </p>
                <div className="flex items-stretch rounded-lg border border-[var(--border-strong)] overflow-hidden focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/15 transition-all">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32);
                      setSubdomain(val);
                    }}
                    className="flex-1 px-4 py-3 text-sm font-mono outline-none bg-transparent min-w-0"
                    placeholder="learn"
                  />
                  <div className="flex items-center px-4 bg-[var(--bg-muted)] border-l border-[var(--border)] text-sm font-mono text-[var(--text-muted)] select-none whitespace-nowrap">
                    .{toSubdomain(orgName) || "yourorg"}.org
                  </div>
                </div>

                {/* Availability indicator */}
                {subdomain.length >= 3 && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {subdomainChecking ? (
                      <span className="text-xs text-[var(--text-muted)]">Checking...</span>
                    ) : subdomainAvailable === true ? (
                      <span className="text-xs text-[#059669] font-medium flex items-center gap-1">
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
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleCreateOrg}
              disabled={!step2Valid || submitting}
              className="mt-8 w-full rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--primary-dark)] disabled:opacity-50"
              style={{ minHeight: 44, boxShadow: "0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)" }}
            >
              {submitting ? "Creating..." : "Continue"}
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 3: Brand It                    */}
        {/* ═══════════════════════════════════ */}
        {step === 3 && (
          <div key="step3" className="max-w-xl mx-auto step-enter">
            <h1 className="font-[family-name:var(--font-display)] text-[32px] leading-[1.2] font-semibold text-[var(--text-primary)]">
              Make it yours
            </h1>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
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
                    accept="image/png,image/svg+xml,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                    }}
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    <p className="text-xs text-[var(--text-muted)]">PNG, JPG, or SVG, max 2MB</p>
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
                      className="h-11 w-11 cursor-pointer rounded-xl border border-[var(--border)] p-0 overflow-hidden"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
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
                      className="h-11 w-11 cursor-pointer rounded-xl border border-[var(--border)] p-0 overflow-hidden"
                      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
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
              <div className="mt-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                style={{ minHeight: 44 }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveBranding}
                disabled={submitting}
                className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--primary-dark)] disabled:opacity-50"
                style={{ minHeight: 44, boxShadow: "0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)" }}
              >
                {submitting ? "Saving..." : "Continue"}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 4: Pricing                     */}
        {/* ═══════════════════════════════════ */}
        {step === 4 && (
          <div key="step4" className="max-w-xl mx-auto step-enter">
            <h1 className="font-[family-name:var(--font-display)] text-[32px] leading-[1.2] font-semibold text-[var(--text-primary)]">
              How many students will use the program?
            </h1>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Every feature is included at every level. The more students you bring, the less each one costs.
            </p>

            {/* Student count input */}
            <div className="mt-8">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Estimated student count
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={studentCountInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setStudentCountInput(raw);
                  const v = parseInt(raw, 10);
                  if (!isNaN(v) && v >= 1) setStudentCount(Math.min(v, 100000));
                  else if (raw === "") setStudentCount(0);
                }}
                className="w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-lg outline-none transition-colors focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 font-mono"
                autoFocus
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                You commit to this number annually. If enrollment exceeds your estimate by more than 10%, we&apos;ll invoice the difference at your per-student rate at the end of the contract year.
              </p>
            </div>

            {/* Volume pricing table */}
            <div className="mt-6 rounded-xl border border-[var(--border)] overflow-hidden">
              <table className="w-full text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
                <thead>
                  <tr className="bg-[var(--bg-subtle)]">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Students</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Per Student / Year</th>
                  </tr>
                </thead>
                <tbody>
                  {VOLUME_TIERS.map((tier) => {
                    const isActive = studentCount >= tier.min && studentCount <= tier.max;
                    return (
                      <tr
                        key={tier.min}
                        className="border-t border-[var(--border)]"
                        style={{
                          background: isActive ? "rgba(13,148,136,0.05)" : "transparent",
                        }}
                      >
                        <td className="px-4 py-3 text-[var(--text-primary)]" style={{ fontWeight: isActive ? 600 : 400 }}>
                          {tier.label}
                          {isActive && (
                            <span className="ml-2 text-xs font-medium text-[var(--primary)]">Your rate</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono" style={{ color: isActive ? "var(--primary)" : "var(--text-secondary)", fontWeight: isActive ? 700 : 400 }}>
                          ${tier.price}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 text-[var(--text-primary)]" style={{ fontWeight: studentCount > 50000 ? 600 : 400 }}>
                      50,000+ students
                      {studentCount > 50000 && (
                        <span className="ml-2 text-xs font-medium text-[var(--primary)]">Your rate</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)]" style={{ fontWeight: studentCount > 50000 ? 700 : 400 }}>
                      Custom
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total cost summary */}
            {studentCount > 0 && studentCount <= 50000 && (
              <div className="mt-6 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-5 summary-enter">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      <span className="font-mono font-medium text-[var(--text-primary)]">{studentCount.toLocaleString()}</span> students
                      {" "}<span className="text-[var(--text-muted)]">×</span>{" "}
                      <span className="font-mono font-medium text-[var(--text-primary)]">${getPriceForCount(studentCount)}</span>/student
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {formatCurrency(studentCount * getPriceForCount(studentCount))}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">per year (USD)</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[rgba(13,148,136,0.1)] flex items-baseline justify-between">
                  <p className="text-xs text-[var(--text-muted)]">One-time setup (branding, onboarding, training)</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{formatCurrency(IMPLEMENTATION_FEE)}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-[rgba(13,148,136,0.1)] flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Year 1 total</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {formatCurrency(studentCount * getPriceForCount(studentCount) + IMPLEMENTATION_FEE)}
                  </p>
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">Annual contract, billed upfront. 90-day cancellation notice. Student data exported within 30 days of cancellation.</p>
              </div>
            )}

            {/* What's included */}
            <div className="mt-6">
              <p className="text-sm text-[var(--text-secondary)]">
                All features included: AI-guided lessons, scenarios, progress tracking, branding, impact reporting, and email support.{" "}
                <button
                  type="button"
                  onClick={() => setFeaturesExpanded(!featuresExpanded)}
                  className="text-[var(--primary)] font-medium hover:underline"
                >
                  {featuresExpanded ? "Hide details" : "See details"}
                </button>
              </p>
              {featuresExpanded && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "AI-guided lessons (your curriculum)",
                    "Scenario simulations",
                    "Student progress tracking",
                    "Your branding on everything",
                    "Impact reporting + CSV export",
                    "Sponsor-ready scenario builder",
                    "Email support (48hr response)",
                  ].map((f) => (
                    <div key={f} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <svg className="h-4 w-4 shrink-0 mt-0.5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            {/* Sales-assisted path */}
            <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                Need a custom quote for your board? Have more than 50,000 students?
              </p>
              <a
                href="mailto:aj@adaptable.one?subject=Custom%20Quote%20Request&body=Organization%20name:%0AEstimated%20students:%0AQuestions:"
                className="mt-2 inline-block text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
              >
                Contact us for a custom quote
              </a>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                We&apos;ll send you a one-page PDF you can share with your board or procurement team.
              </p>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                style={{ minHeight: 44 }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleContinueToPayment}
                disabled={submitting || studentCount < 1 || studentCount > 50000}
                className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--primary-dark)] disabled:opacity-50"
                style={{ minHeight: 48, boxShadow: "0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)" }}
              >
                {submitting ? "Redirecting to checkout..." : "Continue to Payment"}
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-[var(--text-muted)]">Secure payment powered by Stripe</p>
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 5: Curriculum                   */}
        {/* ═══════════════════════════════════ */}
        {step === 5 && (
          <div key="step5" className="mx-auto max-w-xl step-enter">
            {/* Phase A: Upload */}
            {draftLessons.length === 0 && !processing && (
              <div className="step-enter">
                <h1 className="font-[family-name:var(--font-display)] text-[32px] leading-[1.2] font-semibold text-[var(--text-primary)]">
                  Upload your curriculum
                </h1>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Lessons will be built exclusively from content you provide.
                </p>

                {/* IP consent checkbox */}
                <label className="mt-6 flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ipConsent}
                    onChange={(e) => setIpConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--border-strong)] text-[var(--primary)] focus:ring-[var(--primary)]/20"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">
                    I confirm my organization owns or has the right to use all uploaded materials
                  </span>
                </label>

                {/* Drag-drop zone */}
                <div
                  onDrop={handleCurriculumDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => curriculumFileInputRef.current?.click()}
                  className="mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-subtle)] px-6 py-10 cursor-pointer hover:border-[var(--primary)]/40 transition-colors"
                >
                  <svg className="h-8 w-8 text-[var(--text-muted)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                  <p className="text-sm text-[var(--text-muted)]">
                    Drop PDF, DOCX, PPTX, or TXT files here, or{" "}
                    <span className="text-[var(--primary)] font-medium">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Supported formats: PDF, DOCX, PPTX, TXT
                  </p>
                </div>
                <input
                  ref={curriculumFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.pptx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setCurriculumFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />

                {/* File list */}
                {curriculumFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {curriculumFiles.map((f, i) => (
                      <div
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <svg className="h-4 w-4 text-[var(--text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <span className="text-sm text-[var(--text-primary)] truncate">{f.name}</span>
                          <span className="text-xs text-[var(--text-muted)] shrink-0">
                            {(f.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCurriculumFile(i);
                          }}
                          className="text-xs text-[var(--error)] hover:underline shrink-0 ml-3"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => goToStep(4)}
                    className="rounded-lg border border-[var(--border-strong)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                    style={{ minHeight: 44 }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!ipConsent || curriculumFiles.length === 0}
                    onClick={handleCurriculumUpload}
                    className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--primary-dark)] disabled:opacity-50"
                    style={{ minHeight: 44, boxShadow: "0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)" }}
                  >
                    Process Curriculum
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={handleSkipCurriculum}
                    disabled={submitting}
                    className="text-sm text-[var(--primary)] font-medium hover:underline transition-colors disabled:opacity-50"
                  >
                    Skip — use default curriculum
                  </button>
                </div>
              </div>
            )}

            {/* Phase B: Processing */}
            {processing && (
              <div className="step-enter text-center py-12">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--text-primary)]">
                  Building your lessons...
                </h2>
                <div className="mt-6 mx-auto max-w-sm">
                  <div className="h-3 w-full rounded-full bg-[var(--bg-muted)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${processProgress}%`,
                        background: "var(--primary)",
                      }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">
                    {processMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Phase C: Review */}
            {draftLessons.length > 0 && !processing && (
              <div className="step-enter">
                <h2 className="font-[family-name:var(--font-display)] text-[32px] leading-[1.2] font-semibold text-[var(--text-primary)]">
                  Your lessons are ready
                </h2>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Review, edit, or remove lessons before launching.
                </p>

                <div className="mt-6 space-y-6">
                  {curriculumModules.map((mod) => (
                    <div key={mod.name}>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3">
                        {mod.name}
                      </h3>
                      <div className="space-y-2">
                        {mod.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 transition-opacity"
                            style={{
                              opacity: lesson.status === "rejected" ? 0.4 : 1,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                            }}
                          >
                            {editingLesson === lesson.id ? (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Title</label>
                                  <input
                                    type="text"
                                    value={lessonEdits[lesson.id]?.title ?? lesson.title}
                                    onChange={(e) =>
                                      setLessonEdits((prev) => ({
                                        ...prev,
                                        [lesson.id]: { ...prev[lesson.id], title: e.target.value },
                                      }))
                                    }
                                    className="w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Objective</label>
                                  <input
                                    type="text"
                                    value={lessonEdits[lesson.id]?.objective ?? lesson.objective}
                                    onChange={(e) =>
                                      setLessonEdits((prev) => ({
                                        ...prev,
                                        [lesson.id]: { ...prev[lesson.id], objective: e.target.value },
                                      }))
                                    }
                                    className="w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => saveLessonEdit(lesson.id)}
                                    className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--primary-dark)] transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingLesson(null);
                                      setLessonEdits((prev) => {
                                        const next = { ...prev };
                                        delete next[lesson.id];
                                        return next;
                                      });
                                    }}
                                    className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-[var(--text-primary)]">
                                    {lessonEdits[lesson.id]?.title ?? lesson.title}
                                  </p>
                                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    {lessonEdits[lesson.id]?.objective ?? lesson.objective}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setEditingLesson(lesson.id)}
                                    className="text-xs text-[var(--primary)] font-medium hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleLessonRemove(lesson.id)}
                                    className="text-xs font-medium hover:underline"
                                    style={{
                                      color: lesson.status === "rejected" ? "var(--primary)" : "var(--error)",
                                    }}
                                  >
                                    {lesson.status === "rejected" ? "Restore" : "Remove"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="mt-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleApproveLessons}
                  disabled={submitting || draftLessons.filter((l) => l.status !== "rejected").length === 0}
                  className="mt-8 w-full rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--primary-dark)] disabled:opacity-50"
                  style={{ minHeight: 44, boxShadow: "0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)" }}
                >
                  {submitting ? "Saving..." : `Approve ${draftLessons.filter((l) => l.status !== "rejected").length} Lessons & Continue`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════ */}
        {/* STEP 6: Launchpad                   */}
        {/* ═══════════════════════════════════ */}
        {step === 6 && (
          <div key="step6" className="mx-auto max-w-lg step-enter">
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
                  <div className="mt-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* Launchpad */}
            {!submitting && subscriptionStatus !== "incomplete" && (
              <>
                <div className="text-center">
                  <h1 className="font-[family-name:var(--font-display)] text-[32px] leading-[1.2] font-semibold text-[var(--text-primary)]">
                    Your program is ready
                  </h1>
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">
                    Preview everything before going live. Students won&apos;t see anything until you launch.
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  {/* Card 1: Preview */}
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
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

                  {/* Card 2: Program URL */}
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Your program is live at
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <code className="flex-1 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] px-4 py-3 font-mono text-sm font-semibold text-[var(--text-primary)] text-center">
                        {subdomain}.{toSubdomain(orgName)}.org
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${subdomain}.${toSubdomain(orgName)}.org`;
                          navigator.clipboard.writeText(url);
                          setCodeCopied(true);
                          setTimeout(() => setCodeCopied(false), 2000);
                        }}
                        className="rounded-lg border border-[var(--border-strong)] px-3 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors shrink-0"
                        style={{ minHeight: 44 }}
                      >
                        {codeCopied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      Share this link with your students and staff. Anyone who visits can sign up and start the program.
                    </p>
                  </div>

                </div>

                {error && (
                  <div className="mt-4 rounded-lg border border-[var(--error)]/20 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]">
                    {error}
                  </div>
                )}

                {/* Launch confirmation */}
                {!launchConfirming ? (
                  <button
                    type="button"
                    onClick={() => setLaunchConfirming(true)}
                    className="mt-8 w-full rounded-lg bg-[var(--primary)] px-4 py-4 text-base font-semibold text-white transition-all hover:bg-[var(--primary-dark)]"
                    style={{ minHeight: 48, boxShadow: "0 1px 2px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)" }}
                  >
                    Launch Program
                  </button>
                ) : (
                  <div className="mt-8 rounded-xl border-2 border-[var(--primary)] bg-[var(--primary)]/5 p-5">
                    <p className="text-sm text-[var(--text-secondary)]">
                      Once you launch, students can access your program at{" "}
                      <span className="font-mono font-semibold text-[var(--text-primary)]">
                        {subdomain}.{toSubdomain(orgName)}.org
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
                  Need help? Email{" "}
                  <a
                    href="mailto:aj@adaptable.one"
                    className="text-[var(--primary)] hover:underline"
                  >
                    aj@adaptable.one
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
