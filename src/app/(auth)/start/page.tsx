"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

function StartPageInner() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  return (
    <main style={{ padding: "100px", textAlign: "center" }}>
      <h1>Start Page — Step {step}</h1>
      <p>Loading: {String(loading)}</p>
      <p>SearchParams exists: {String(!!searchParams)}</p>
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
