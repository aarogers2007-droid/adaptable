"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getOnboardingContext } from "./actions";
import { activateSubscription } from "./stripe-actions";
import { ONBOARDING_STEP } from "./constants";
import { useAuthListener } from "./use-auth-listener";
import Step1Auth from "./Step1Auth";
import Step2Program from "./Step2Program";
import Step3Brand from "./Step3Brand";
import Step4Pricing from "./Step4Pricing";
import Step5Launch from "./Step5Launch";

const STEP_LABELS = ["Account", "Program", "Brand", "Pricing", "Launch"];

function ProgressBar({ step, onStepClick }: { step: number; onStepClick?: (s: number) => void }) {
  return (
    <div className="mb-8">
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
                  ) : stepNum}
                </div>
                <span className="text-xs" style={{ color: current ? "var(--text-primary)" : "var(--text-muted)", fontWeight: current ? 600 : 400 }}>
                  {label}
                </span>
              </button>
              {i < STEP_LABELS.length - 1 && (
                <div className="flex-1 h-[2px] rounded-full mx-2" style={{ background: step > stepNum ? "var(--primary)" : "var(--border)", transition: "background 500ms ease-out" }} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex sm:hidden items-center justify-center gap-3">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const completed = step > stepNum;
          const current = step === stepNum;
          return (
            <button key={label} type="button" className="flex flex-col items-center gap-1" style={{ cursor: completed ? "pointer" : "default" }} onClick={() => completed && onStepClick?.(stepNum)} disabled={!completed}>
              <div className="h-2.5 w-2.5 rounded-full transition-colors" style={{ background: completed || current ? "var(--primary)" : "var(--border)" }} />
              {current && <span className="text-[10px] font-semibold text-[var(--text-primary)]">{label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StartPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email: string; fullName: string } | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [subdomain, setSubdomain] = useState("");

  function goToStep(n: number) {
    setError(null);
    setStep(n);
  }

  // Init
  useEffect(() => {
    async function init() {
      try {
        const ctx = await getOnboardingContext();
        const sessionId = searchParams?.get("session_id") ?? null;

        if (ctx.user) {
          setUser(ctx.user);
        }
        if (ctx.org) {
          setOrgId(ctx.org.id);
          setOrgName(ctx.org.name);
          setSubdomain(ctx.org.subdomain);
        }

        if (ctx.user && ctx.onboardingStep >= ONBOARDING_STEP.COMPLETE) {
          router.push("/instructor/dashboard");
          return;
        }

        if (sessionId && ctx.user) {
          setStep(5);
          setLoading(false);
          // Activate subscription in background
          activateSubscription(sessionId).catch(() => {});
          return;
        }

        if (ctx.user) {
          // Only advance if the prerequisites are met
          if (!ctx.org) {
            setStep(2); // No org yet, go to program setup
          } else {
            const nextStep = Math.min((ctx.onboardingStep ?? 0) + 1, 5);
            setStep(nextStep);
          }
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

  // Auth listener (isolated in custom hook)
  useAuthListener((newUser, ctx) => {
    setUser(newUser);
    if (ctx.org) {
      setOrgId(ctx.org.id);
      setOrgName(ctx.org.name);
      setSubdomain(ctx.org.subdomain);
      const nextStep = Math.min((ctx.onboardingStep ?? 0) + 1, 5);
      goToStep(nextStep);
    } else {
      goToStep(2);
    }
  });

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-2xl">
        <ProgressBar step={step} onStepClick={goToStep} />

        {step === 1 && (
          <Step1Auth
            error={error}
            setError={setError}
            onSignedUp={(u) => {
              setUser(u);
              goToStep(2);
            }}
          />
        )}

        {step === 2 && (
          <Step2Program
            error={error}
            setError={setError}
            onComplete={(id, name, sub) => {
              setOrgId(id);
              setOrgName(name);
              setSubdomain(sub);
              goToStep(3);
            }}
          />
        )}

        {step === 3 && orgId && (
          <Step3Brand
            orgId={orgId}
            orgName={orgName}
            error={error}
            setError={setError}
            onComplete={() => goToStep(4)}
            onBack={() => goToStep(2)}
          />
        )}
        {step === 4 && orgId && (
          <Step4Pricing
            orgId={orgId}
            userEmail={user?.email ?? ""}
            error={error}
            setError={setError}
            onBack={() => goToStep(3)}
          />
        )}
        {step === 5 && orgId && (
          <Step5Launch
            orgId={orgId}
            orgName={orgName}
            subdomain={subdomain}
            error={error}
            setError={setError}
            onBack={() => goToStep(4)}
          />
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
