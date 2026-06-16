import type { Metadata } from "next";
import DrawingCanvas from "@/components/DrawingCanvas";

export const metadata: Metadata = {
  title: "Draw — Adaptable",
  description: "Draw with your cursor. No art skills required.",
};

const DEFAULT_PROMPT = "Draw your brain on your best day.";

// LAYER 2: drawing surface + export. The prompt is customizable via ?prompt=
// so the same page works for any challenge (intern assessment, lessons, etc.).
// Public so it can be handed out. Direct-submit + gallery come later, at volume.
export default async function DrawPage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string }>;
}) {
  const sp = await searchParams;
  const prompt =
    typeof sp.prompt === "string" && sp.prompt.trim()
      ? sp.prompt.trim().slice(0, 200)
      : DEFAULT_PROMPT;

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[var(--bg)] flex flex-col items-center px-6 py-16"
    >
      <div className="flex flex-col items-center text-center mb-8 max-w-xl">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Draw it
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
          {prompt}
        </h1>
        <p className="mt-4 text-base text-[var(--text-secondary)]">
          Use your cursor. No art skills required. Don&apos;t think, just draw. When
          you&apos;re done, hit <strong>Save</strong> and attach the file to your reply.
        </p>
      </div>
      <DrawingCanvas />
    </main>
  );
}
