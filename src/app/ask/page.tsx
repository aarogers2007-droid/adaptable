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

// LAYER 2 (data layer): wires the chat to /api/ask-chat and shows raw streamed
// replies. Proves the data flow in production. Polish/cards/capture come later.
export default function AskPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-[var(--bg)] flex flex-col items-center px-6 py-24"
    >
      <div className="flex flex-col items-center text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)] max-w-3xl">
          Ask Adaptable
        </h1>
        <p className="mt-6 text-lg text-[var(--text-secondary)] max-w-xl">
          Curious how it works? Ask anything.
        </p>
      </div>
      <AskChat />
    </main>
  );
}
