"use client";

export default function CardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-subtle)]">
      <div className="text-center max-w-md px-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold mb-2">
          Something went wrong
        </h2>
        <p className="text-[var(--text-muted)] mb-6 text-sm">
          {error.message || "Failed to load your business card."}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
