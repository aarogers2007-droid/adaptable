"use client";

import { useRef, useState } from "react";

// The founder chat at the bottom of /assessment. A disclosed AI stand-in for AJ
// (it says so itself on the first turn). Genuine two-way: answers their
// questions and pulls on their thinking. Streams from /api/aj-chat. Transcript
// is persisted server-side, keyed by session, so it joins to their submission.

type Turn = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Wait, are you actually AJ?",
  "What is Adaptable, really?",
  "What are you looking for in someone?",
  "Why would my Chick-fil-A job matter here?",
];

export default function AjChat() {
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
    setMessages((m) => [
      ...m,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);
    setStreaming(true);

    try {
      const res = await fetch("/api/aj-chat", {
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
            // ignore malformed SSE line
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
    <div className="w-full text-left">
      {isEmpty && (
        <div className="flex flex-col gap-2">
          {STARTERS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-left text-sm text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 active:scale-[0.98]"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {!isEmpty && (
        <div className="flex flex-col gap-3">
          {messages.map((m, i) => {
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
              <div
                key={i}
                className="self-start max-w-[85%] rounded-lg bg-[var(--bg-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] whitespace-pre-wrap"
              >
                {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
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
          placeholder="Ask me anything…"
          className="flex-1 rounded-lg border border-[var(--border-strong)] px-4 py-3 text-base text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
          disabled={streaming}
          maxLength={2000}
          aria-label="Ask AJ's AI a question"
        />
        <button
          type="submit"
          disabled={streaming || input.trim().length === 0}
          className="rounded-lg bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
        >
          {streaming ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
