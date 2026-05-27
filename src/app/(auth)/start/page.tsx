"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getOnboardingContext,
} from "./actions";
import { ONBOARDING_STEP } from "./constants";

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
        const urlStep = searchParams?.get("step") ?? null;
        if (urlStep) {
          const parsed = parseInt(urlStep, 10);
          if (parsed >= 1 && parsed <= 6) setStep(parsed);
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
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold">Start Page — Step {step}</h1>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <p className="mt-4 text-sm text-gray-500">
          Test: hooks + server actions + early return + router + searchParams.
        </p>
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`px-3 py-1 rounded ${step === s ? "bg-teal-600 text-white" : "bg-gray-100"}`}
            >
              {s}
            </button>
          ))}
        </div>
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
