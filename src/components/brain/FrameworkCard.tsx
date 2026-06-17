// Larry's Brain — the reusable lesson shell: a framework card (concept + diagram)
// followed by an "apply it" prompt that will later kick off the mentor chat.
// Pure self-discovery; no business/entrepreneurship framing.

export default function FrameworkCard({
  module,
  title,
  intro,
  principles,
  applyPrompt,
  children,
  chat,
}: {
  module: string;
  title: string;
  intro: string;
  principles: string[];
  applyPrompt: string;
  children: React.ReactNode;
  chat?: React.ReactNode;
}) {
  return (
    <article className="w-full max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
        {module}
      </p>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-[var(--text-secondary)]">{intro}</p>

      {/* The diagram */}
      <div className="my-7 rounded-lg bg-[var(--bg-subtle)] px-4 py-7">{children}</div>

      {/* Takeaways */}
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        The takeaways
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {principles.map((p, i) => (
          <li key={i} className="flex gap-2 text-base text-[var(--text-primary)]">
            <span aria-hidden className="mt-1 text-[var(--primary)]">•</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>

      {/* Apply it (mentor chat hooks in here later) */}
      <div className="mt-7 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-4">
        <p className="text-base text-[var(--text-primary)]">{applyPrompt}</p>
        {chat ?? (
          <button
            type="button"
            disabled
            className="mt-3 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white opacity-50"
          >
            Talk it through (coming soon)
          </button>
        )}
      </div>
    </article>
  );
}
