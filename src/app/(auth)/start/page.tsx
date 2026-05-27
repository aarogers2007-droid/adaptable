"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { getOnboardingContext } from "./actions";
import { ONBOARDING_STEP } from "./constants";

function StartPageInner() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("init");

  useEffect(() => {
    async function init() {
      try {
        const ctx = await getOnboardingContext();
        setStatus(`got context: user=${!!ctx.user}, org=${!!ctx.org}, step=${ctx.onboardingStep}`);
      } catch (err) {
        setStatus(`error: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  return (
    <main style={{ padding: "100px", textAlign: "center" }}>
      <h1>Start Page — Step {step}</h1>
      <p>Loading: {String(loading)}</p>
      <p>Status: {status}</p>
    </main>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StartPageInner />
    </Suspense>
  );
}
