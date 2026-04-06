"use client";

import { useState, useEffect } from "react";
import CompletionCeremony from "./CompletionCeremony";

interface CompletionWrapperProps {
  studentName: string;
  businessName: string;
  businessNiche: string;
  ikigai: {
    passions: string[];
    skills: string[];
    needs: string[];
    monetization: string;
  } | null;
  children: React.ReactNode;
}

export default function CompletionWrapper({
  studentName,
  businessName,
  businessNiche,
  ikigai,
  children,
}: CompletionWrapperProps) {
  const [showCeremony, setShowCeremony] = useState(false);
  const [ceremonyDone, setCeremonyDone] = useState(false);

  useEffect(() => {
    // Check if ceremony has been viewed before
    const viewed = sessionStorage.getItem("adaptable_ceremony_viewed");
    if (viewed) {
      setCeremonyDone(true);
    } else {
      setShowCeremony(true);
    }
  }, []);

  function handleCeremonyComplete() {
    sessionStorage.setItem("adaptable_ceremony_viewed", "true");
    setShowCeremony(false);
    setCeremonyDone(true);
  }

  function handleReplay() {
    sessionStorage.removeItem("adaptable_ceremony_viewed");
    setCeremonyDone(false);
    setShowCeremony(true);
  }

  if (showCeremony) {
    return (
      <CompletionCeremony
        studentName={studentName}
        businessName={businessName}
        businessNiche={businessNiche}
        ikigai={ikigai}
        onComplete={handleCeremonyComplete}
      />
    );
  }

  if (ceremonyDone) {
    return (
      <div>
        {children}
        <div className="mx-auto max-w-2xl px-4 pb-12 text-center">
          <button
            onClick={handleReplay}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Replay ceremony
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  return null;
}
