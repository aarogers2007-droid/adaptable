"use client";

import { useRef, useState } from "react";

// LAYER 3 (structure): guided spectacle. Curated starter questions on the empty
// state (so a non-technical prospect never faces a blank box), plus suggested
// follow-up chips parsed from the bot's [OPTIONS] block after each answer.
// Mirrors the scenario system's [OPTIONS] format (MCOptions.tsx) but renders
// as clean chips instead of lettered MC cards.

type Turn = { role: "user" | "assistant"; content: string };

// Curated openers: teach the clueless, steer toward value + the founder window.
const STARTERS = [
  "What is Adaptable, in plain English?",
  "How does it keep what students learn accurate?",
  "What does my organization actually get?",
  "Who's behind this?",
];

/**
 * Split an assistant message into visible prose + follow-up options.
 * Handles the mid-stream case where [OPTIONS] has opened but not yet closed
 * (hide the raw markup until the closing tag arrives).
 */
function splitOptions(content: string): { visible: string; options: string[] } {
  const full = content.match(/\[OPTIONS\]([\s\S]*?)\[\/OPTIONS\]/);
  if (full) {
    const visible = content.replace(/\[OPTIONS\][\s\S]*?\[\/OPTIONS\]/, "").trim();
    const options = full[1]
      .trim()
      .split("\n")
      .map((l) => l.trim().match(/^[A-D]\.\s*(.+)$/)?.[1]?.trim())
      .filter((t): t is string => !!t);
    return { visible, options };
  }
  // Streaming: [OPTIONS] opened but not closed yet — hide from here on.
  const open = content.indexOf("[OPTIONS]");
  if (open !== -1) return { visible: content.slice(0, open).trim(), options: [] };
  return { visible: content, options: [] };
}

export default function AskChat() {
  const [messages, setMessages] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        setMessages((m) => m.slice(0, -1)); // drop empty assistant placeholder
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
            // ignore partial / non-JSON keepalive lines
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

  const isEmpty = messages.length === 0;

  return (
    <div className="mt-8 w-full max-w-xl text-left">
      {/* Empty state: curated starter chips so nobody faces a blank box */}
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

      {/* Conversation */}
      {!isEmpty && (
        <div className="flex flex-col gap-3">
          {messages.map((m, i) => {
            const isLastAssistant =
              m.role === "assistant" && i === messages.length - 1 && !streaming;
            const { visible, options } =
              m.role === "assistant" ? splitOptions(m.content) : { visible: m.content, options: [] };

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
                  {visible || (streaming && i === messages.length - 1 ? "…" : "")}
                </div>
                {isLastAssistant && options.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {options.map((opt) => (
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
