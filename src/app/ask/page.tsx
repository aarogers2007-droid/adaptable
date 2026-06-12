import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask Adaptable",
  description:
    "Ask anything about Adaptable — how it works, what it does for your organization, and how it keeps students' learning real.",
  openGraph: {
    title: "Ask Adaptable",
    description:
      "Ask anything about Adaptable — how it works, what it does for your organization, and how it keeps students' learning real.",
    url: "https://adaptable-one.vercel.app/ask",
    siteName: "Adaptable",
    type: "website",
  },
};

import AskChat from "./AskChat";
import { ASK_FAQ } from "@/lib/ask-faq";

// GEO note: the chat (AskChat) is client-rendered, which AI answer engines can't
// read (they don't execute JS). So the curated Q&A also renders here as static,
// server-side HTML + FAQPage schema — crawlable and citable at the same URL we
// hand out. Chat is the hero for humans; the FAQ below is for crawlers + scrollers.
export default function AskPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ASK_FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[var(--bg)] flex flex-col items-center px-6 py-24"
    >
      {/* FAQPage structured data for AI answer engines + search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="flex flex-col items-center text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)] max-w-3xl">
          Ask Adaptable
        </h1>
        <p className="mt-6 text-lg text-[var(--text-secondary)] max-w-xl">
          Curious how it works? Ask anything.
        </p>
      </div>

      <AskChat />

      {/* Static, server-rendered FAQ — the crawlable/citable content */}
      <section
        aria-label="Common questions about Adaptable"
        className="mt-20 w-full max-w-2xl border-t border-[var(--border)] pt-12"
      >
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
          Common questions
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Or ask your own above — the answers stream live.
        </p>
        <dl className="mt-8 flex flex-col gap-8">
          {ASK_FAQ.map((item) => (
            <div key={item.q}>
              <dt className="text-lg font-semibold text-[var(--text-primary)]">
                {item.q}
              </dt>
              <dd className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
