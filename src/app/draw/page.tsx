import type { Metadata } from "next";
import DrawingCanvas from "@/components/DrawingCanvas";

export const metadata: Metadata = {
  title: "Draw — Adaptable",
  description: "Draw with your cursor. No art skills required.",
};

// LAYER 1: working SVG drawing surface. Public so it can be handed out (e.g.,
// the intern assessment). Save/submit + prompts come in later layers.
export default function DrawPage() {
  return (
    <main
      id="main-content"
      className="min-h-screen bg-[var(--bg)] flex flex-col items-center px-6 py-16"
    >
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
          Draw it
        </h1>
        <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-xl">
          Use your cursor. No art skills required. Don&apos;t think, just draw.
        </p>
      </div>
      <DrawingCanvas />
    </main>
  );
}
