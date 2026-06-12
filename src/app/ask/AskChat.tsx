"use client";

import { useRef, useState } from "react";

// LAYER 4 (the close): guided chat + the [CAPTURE] card. The bot emits a
// [CAPTURE] marker at buying signal; the client renders an inline, dismissible
// card asking first name (email/note optional) with a consent line. Skipping
// keeps the conversation going. Lead + transcript POST to /api/ask-lead.

type Turn = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "What is Adaptable, in plain English?",
  "How does it keep what students learn accurate?",
  "What does my organization actually get?",
  "Who's behind this?",
];

/** Strip [OPTIONS] and [CAPTURE] from an assistant message; surface both. */
function parseAssistant(content: string): {
  visible: string;
  options: string[];
  capture: boolean;
} {
  const capture = content.includes("[CAPTURE]");
  let text = content.replace(/\[CAPTURE\]/g, "");

  const full = text.match(/\[OPTIONS\]([\s\S]*?)\[\/OPTIONS\]/);
  let options: string[] = [];
  if (full) {
    options = full[1]
      .trim()
      .split("\n")
      .map((l) => l.trim().match(/^[A-D]\.\s*(.+)$/)?.[1]?.trim())
      .filter((t): t is string => !!t);
    text = text.replace(/\[OPTIONS\][\s\S]*?\[\/OPTIONS\]/, "");
  } else {
    const open = text.indexOf("[OPTIONS]"); // mid-stream, not yet closed
    if (open !== -1) text = text.slice(0, open);
  }
  return { visible: text.trim(), options, capture };
}

export default function AskChat() {
  const [messages, setMessages] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Capture card state
  const [capResolved, setCapResolved] = useState(false); // submitted or skipped
  const [capDone, setCapDone] = useState<string | null>(null); // thank-you name
  const [capSubmitting, setCapSubmitting] = useState(false);
  const [capError, setCapError] = useState<string | null>(null);
  const [capName, setCapName] = useState("");
  const [capEmail, setCapEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const sessionId = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  async function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text || streaming) return;
    setError(null);
    setInput("");

    const history = messages.slice(-10);
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/ask-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: sessionId.current, history }),
      });

      if (!res.ok || !res.body) {
        let msg = "Something went wrong. Try again?";
        try {
          const j = await res.json();
          if (j?.error) msg = j.error;
        } catch {}
        setError(msg);
        setMessages((m) => m.slice(0, -1));
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload) continue;
          try {
            const data = JSON.parse(payload);
            if (data.text) {
              setMessages((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") {
                  copy[copy.length - 1] = { ...last, content: last.content + data.text };
                }
                return copy;
              });
            } else if (data.error) {
              setError(data.error);
            }
          } catch {
            // ignore
          }
        }
      }
    } catch {
      setError("Connection dropped. Try again?");
      setMessages((m) => (m[m.length - 1]?.content === "" ? m.slice(0, -1) : m));
    } finally {
      setStreaming(false);
    }
  }

  async function submitLead() {
    if (capSubmitting) return;
    const name = capName.trim();
    if (!name) {
      setCapError("Just your first name to send it.");
      return;
    }
    setCapSubmitting(true);
    setCapError(null);
    try {
      const res = await fetch("/api/ask-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId.current,
          name,
          email: capEmail.trim() || undefined,
          company_website: honeypot, // honeypot — real users leave empty
          consent: true,
          transcript: messages,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCapError(j?.error || "Couldn't send that. Try again?");
        setCapSubmitting(false);
        return;
      }
      setCapDone(name);
      setCapResolved(true);
    } catch {
      setCapError("Couldn't send that. Try again?");
    } finally {
      setCapSubmitting(false);
    }
  }

  const isEmpty = messages.length === 0;
  const lastAssistant =
    !streaming && messages.length > 0 && messages[messages.length - 1].role === "assistant"
      ? parseAssistant(messages[messages.length - 1].content)
      : null;
  const showCapture = !!lastAssistant?.capture && !capResolved;

  return (
    <div className="mt-8 w-full max-w-xl text-left">
      {isEmpty && (
        <div className="flex flex-col gap-2">
          {STARTERS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="animate-scale-in rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-left text-sm text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 active:scale-[0.98]"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {!isEmpty && (
        <div className="flex flex-col gap-3">
          {messages.map((m, i) => {
            const isLastAssistant =
              m.role === "assistant" && i === messages.length - 1 && !streaming;
            const parsed =
              m.role === "assistant"
                ? parseAssistant(m.content)
                : { visible: m.content, options: [] as string[], capture: false };

            if (m.role === "user") {
              return (
                <div
                  key={i}
                  className="self-end rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm text-white max-w-[85%]"
                >
                  {m.content}
                </div>
              );
            }

            return (
              <div key={i} className="flex flex-col gap-2 max-w-[85%]">
                <div className="self-start rounded-lg bg-[var(--bg-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                  {parsed.visible || (streaming && i === messages.length - 1 ? "…" : "")}
                </div>
                {isLastAssistant && !showCapture && parsed.options.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {parsed.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => send(opt)}
                        className="animate-scale-in self-start rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-left text-sm text-[var(--primary-dark)] transition-all duration-200 hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 active:scale-[0.98]"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Capture confirmation */}
      {capDone && (
        <p className="mt-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 px-4 py-3 text-sm text-[var(--text-primary)]">
          Thanks, {capDone} — the team will reach out. Keep asking anything in the meantime.
        </p>
      )}

      {/* Capture card */}
      {showCapture && !capDone && (
        <div className="animate-scale-in mt-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Want the team to follow up?
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Just a first name. Skip it and keep chatting if you'd rather.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <input
              value={capName}
              onChange={(e) => setCapName(e.target.value)}
              placeholder="First name"
              maxLength={100}
              aria-label="First name"
              className="rounded-lg border border-[var(--border-strong)] px-3 py-2.5 text-base text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            />
            <input
              value={capEmail}
              onChange={(e) => setCapEmail(e.target.value)}
              placeholder="Email (optional)"
              type="email"
              maxLength={200}
              aria-label="Email (optional)"
              className="rounded-lg border border-[var(--border-strong)] px-3 py-2.5 text-base text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            />
            {/* Honeypot — visually hidden, bots fill it */}
            <input
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              name="company_website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />
          </div>
          {capError && <p className="mt-2 text-sm text-[var(--error)]">{capError}</p>}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={submitLead}
              disabled={capSubmitting}
              className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
            >
              {capSubmitting ? "Sending…" : "Send"}
            </button>
            <button
              onClick={() => setCapResolved(true)}
              className="text-sm text-[var(--text-secondary)] underline-offset-2 hover:underline"
            >
              No thanks, keep chatting
            </button>
          </div>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            We&apos;ll only use this to reach out.{" "}
            <a href="/privacy" className="underline" target="_blank" rel="noreferrer">
              Privacy
            </a>
          </p>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-[var(--error)]">{error}</p>}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about Adaptable…"
          className="flex-1 rounded-lg border border-[var(--border-strong)] px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
          disabled={streaming}
          maxLength={2000}
          aria-label="Ask a question about Adaptable"
        />
        <button
          type="submit"
          disabled={streaming || input.trim().length === 0}
          className="rounded-lg bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
        >
          {streaming ? "…" : "Ask"}
        </button>
      </form>
    </div>
  );
}
