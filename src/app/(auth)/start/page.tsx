"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { getOnboardingContext } from "./actions";
import { ONBOARDING_STEP } from "./constants";

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
  }, []);

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
              Layer 3: ProgressBar + dangerouslySetInnerHTML + step 1 skeleton
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
