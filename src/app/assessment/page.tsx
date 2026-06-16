import type { Metadata } from "next";
import AssessmentFlow from "@/components/AssessmentFlow";

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
    </main>
  );
}
