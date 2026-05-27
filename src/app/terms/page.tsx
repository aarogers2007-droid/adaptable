import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Adaptable",
  description: "Terms of Service for the Adaptable platform.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--text-primary)]">
        Terms of Service
      </h1>
      <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed">
        Our Terms of Service are being finalized and will be posted here shortly.
        For questions, contact{" "}
        <a href="mailto:aj@adaptable.one" className="text-[var(--primary)] hover:underline">
          aj@adaptable.one
        </a>
        .
      </p>
    </main>
  );
}
