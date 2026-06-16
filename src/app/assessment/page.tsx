import type { Metadata } from "next";
import AssessmentFlow from "@/components/AssessmentFlow";
import AjChat from "./AjChat";

export const metadata: Metadata = {
  title: "An afternoon — Adaptable",
  description: "Not a test. A taste of building at Adaptable.",
  robots: { index: false, follow: false }, // private hand-out link, keep it out of search
};

// The entire intern assessment under one link: intro + drawing + questions +
// one submit. Public (handed out directly). Submissions store to org #0 via
// /api/assessment-submit (migration 00061).
export default function AssessmentPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-[var(--bg)] flex flex-col items-center px-6 py-16"
    >
      <AssessmentFlow />

      {/* Founder chat — disclosed AI stand-in for AJ. Talk before you submit. */}
      <section className="mt-16 w-full max-w-2xl border-t border-[var(--border)] pt-10">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Before you go
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
          Talk to AJ. Well, his AI.
        </h2>
        <p className="mt-3 text-[var(--text-secondary)]">
          I built an AI of myself so you can ask me anything before we ever get on a call.
          It talks like me, blunt and all. Ask it about the company, the role, what I&apos;m
          actually looking for. Go.
        </p>
        <div className="mt-6">
          <AjChat />
        </div>
      </section>
    </main>
  );
}
