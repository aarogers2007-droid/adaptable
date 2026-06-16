"use client";

import { useCallback, useRef, useState } from "react";
import DrawingCanvas from "@/components/DrawingCanvas";

// The one-link intern assessment. Intro + drawing + questions, all on one page,
// one Submit that sends everything to /api/assessment-submit. Voice = AJ's.

const ARENAS = [
  { key: "Words", label: "Words", blurb: "copy, story, persuasion" },
  { key: "Eye", label: "Eye", blurb: "design, taste, how things look + feel" },
  { key: "Mind", label: "Mind", blurb: "strategy, synthesis, seeing around corners" },
];

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[var(--border)] pt-8">
      <p className="text-sm font-medium uppercase tracking-wide text-[var(--text-muted)]">{n}</p>
      <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const TA =
  "w-full rounded-lg border border-[var(--border-strong)] px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--primary)] min-h-[120px]";

export default function AssessmentFlow() {
  const [drawing, setDrawing] = useState("");
  const [kid, setKid] = useState("");
  const [truth, setTruth] = useState("");
  const [arena, setArena] = useState("");
  const [arenaProof, setArenaProof] = useState("");
  const [surprise, setSurprise] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );
  const onDrawing = useCallback((svg: string) => setDrawing(svg), []);

  async function submit() {
    if (submitting) return;
    if (!name.trim()) {
      setError("Add your name so I know whose this is.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/assessment-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          sessionId: sessionId.current,
          company_website: honeypot,
          drawing,
          answers: { kid, truth, arena, arena_proof: arenaProof, surprise },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j?.error || "Couldn't send that. Try again?");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Connection dropped. Try again?");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="w-full max-w-2xl rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 px-6 py-8 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
          Got it, {name.trim().split(" ")[0]}.
        </h2>
        <p className="mt-3 text-[var(--text-secondary)]">
          That told me more than a résumé ever could. I&apos;ll be in touch about the call.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl flex flex-col gap-10">
      {/* Intro */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold tracking-tight text-[var(--text-primary)]">
          You don&apos;t need a résumé. You need an afternoon.
        </h1>
        <p className="mt-5 text-lg text-[var(--text-secondary)] leading-relaxed">
          I&apos;m not going to ask where you went to school. I want to see who you are when
          nobody&apos;s grading you. So we&apos;re going to play, like you&apos;re 8 again,
          before the world told you who to be. Take an afternoon, no more. There are no wrong
          answers, only the most honest, most <em>you</em> ones.
        </p>
      </div>

      <Section n="01 — Draw it" title="Draw your brain on your best day.">
        <p className="mb-4 text-[var(--text-secondary)]">
          Use your cursor. No art skills required. Don&apos;t think, just draw.
        </p>
        <DrawingCanvas embedded onChange={onDrawing} />
      </Section>

      <Section n="02 — The truth" title="What did you love as a kid?">
        <p className="mb-4 text-[var(--text-secondary)]">
          Before anyone told you what you were supposed to be, what did you love making or
          doing? The real answer, not the impressive one.
        </p>
        <textarea className={TA} value={kid} onChange={(e) => setKid(e.target.value)} maxLength={5000} />
      </Section>

      <Section n="03 — Tell me straight" title="Go play in Adaptable.">
        <p className="mb-4 text-[var(--text-secondary)]">
          Spend 20 minutes in{" "}
          <a href="/ask" target="_blank" rel="noreferrer" className="text-[var(--primary)] underline">
            Adaptable
          </a>
          . What made you smile? What made you cringe? Tell me like you&apos;d tell a friend.
          If you only flatter me, you&apos;ve already lost.
        </p>
        <textarea className={TA} value={truth} onChange={(e) => setTruth(e.target.value)} maxLength={5000} />
      </Section>

      <Section n="04 — Your weapon" title="What are you dangerous at?">
        <div className="flex flex-col gap-2 mb-4">
          {ARENAS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setArena(a.key)}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                arena === a.key
                  ? "border-[var(--primary)] bg-[var(--primary)]/5"
                  : "border-[var(--border)] hover:border-[var(--primary)]/40"
              }`}
            >
              <span className="font-semibold text-[var(--text-primary)]">{a.label}</span>
              <span className="text-[var(--text-secondary)]"> — {a.blurb}</span>
            </button>
          ))}
        </div>
        <p className="mb-3 text-[var(--text-secondary)]">
          Now prove it with one small thing for Adaptable. Describe it, paste it, or link it.
        </p>
        <textarea className={TA} value={arenaProof} onChange={(e) => setArenaProof(e.target.value)} maxLength={5000} />
      </Section>

      <Section n="05 — Surprise me" title="Show me something only you would.">
        <p className="mb-4 text-[var(--text-secondary)]">
          One thing you&apos;ve made that you&apos;re proud of (link or describe it), and one
          thing I didn&apos;t ask for. Surprise me.
        </p>
        <textarea className={TA} value={surprise} onChange={(e) => setSurprise(e.target.value)} maxLength={5000} />
      </Section>

      {/* Identity + submit */}
      <section className="border-t border-[var(--border)] pt-8">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={100}
            aria-label="Your name"
            className="flex-1 rounded-lg border border-[var(--border-strong)] px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            maxLength={200}
            aria-label="Email"
            className="flex-1 rounded-lg border border-[var(--border-strong)] px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
          />
        </div>
        {/* Honeypot */}
        <input
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="sr-only"
        />
        {error && <p className="mt-3 text-sm text-[var(--error)]">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="mt-4 w-full rounded-lg bg-[var(--primary)] px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50 sm:w-auto"
        >
          {submitting ? "Sending…" : "Send it"}
        </button>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Your drawing and answers go straight to AJ. That&apos;s it.
        </p>
      </section>
    </div>
  );
}
