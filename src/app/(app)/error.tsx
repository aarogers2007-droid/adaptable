"use client";
export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Something went wrong</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">We hit an unexpected error. Try refreshing the page.</p>
        <button onClick={reset} className="mt-4 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white">
          Try again
        </button>
      </div>
    </div>
  );
}
