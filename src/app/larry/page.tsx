import type { Metadata } from "next";
import FrameworkCard from "@/components/brain/FrameworkCard";
import WorryModel from "@/components/brain/diagrams/WorryModel";

export const metadata: Metadata = {
  title: "Larry's Brain — preview",
  description: "Self-discovery program preview.",
  robots: { index: false, follow: false }, // internal preview
};

// PREVIEW of the Larry's Brain lesson format (Module 1 · Lesson 1). Public + noindex
// so AJ can eyeball the framework-card + SVG look before we wire the full content
// model + per-org runtime. Not the production student experience.
export default function LarryBrainPreview() {
  return (
    <main className="min-h-screen bg-[var(--bg-subtle)] px-6 py-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
        <p className="text-sm font-medium text-[var(--text-muted)]">
          Larry&apos;s Brain · format preview
        </p>
        <FrameworkCard
          module="Module 1 · Mastering Worry & Fear"
          title="The Worry Model"
          intro="Most worry is wasted. This simple question sorts every problem into one of two outcomes, and both of them free you to stop carrying it."
          principles={[
            "If there's no problem, there's nothing to worry about.",
            "If there is a problem and you can act on it, act, the worry has done its job.",
            "If you can't do anything about it, worry changes nothing. Let it go.",
            "Worry is using your imagination to create something you don't want.",
          ]}
          applyPrompt="Think of something you're carrying right now. Walk it through the model, where does it land, and what does that tell you to do?"
        >
          <WorryModel />
        </FrameworkCard>
      </div>
    </main>
  );
}
