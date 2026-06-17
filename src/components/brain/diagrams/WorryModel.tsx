// The Worry Model — rebuilt as a clean, responsive flowchart (CSS/DOM + SVG arrows,
// no canvas, per the Chromebook rule). Faithful to the source: every path ends at
// "Then don't worry." Real text so it wraps and is screen-readable.

function Node({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-center text-sm font-medium ${
        accent
          ? "border-[var(--primary)]/40 bg-[var(--primary)]/5 text-[var(--primary-dark)]"
          : "border-[var(--border-strong)] bg-[var(--bg)] text-[var(--text-primary)]"
      }`}
    >
      {children}
    </div>
  );
}

function Branch({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pl-2">
      <span className="shrink-0 rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">
        {label}
      </span>
      <span aria-hidden className="text-[var(--text-muted)]">→</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function WorryModel() {
  return (
    <figure className="mx-auto w-full max-w-sm">
      <div className="flex flex-col gap-3">
        <Node>Do you have a problem in your life?</Node>

        <Branch label="No">
          <Node accent>Then don&apos;t worry.</Node>
        </Branch>

        {/* Yes → next question */}
        <div className="flex items-center gap-2 pl-2">
          <span className="shrink-0 rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">
            Yes
          </span>
          <span aria-hidden className="text-[var(--text-muted)]">↓</span>
        </div>

        <Node>Can you do something about it?</Node>

        <Branch label="Yes">
          <Node accent>Then don&apos;t worry.</Node>
        </Branch>
        <Branch label="No">
          <Node accent>Then don&apos;t worry.</Node>
        </Branch>
      </div>
      <figcaption className="mt-4 text-center text-xs text-[var(--text-muted)]">
        Every path ends the same place.
      </figcaption>
    </figure>
  );
}
