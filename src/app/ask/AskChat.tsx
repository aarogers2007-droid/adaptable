"use client";

import { useRef, useState } from "react";

// LAYER 2 (data layer): minimal chat that proves the /api/ask-chat data flow
// end-to-end in production. Raw streamed text, no [OPTIONS] cards, no capture,
// no polish yet — those are later layers.

type Turn = { role: "user" | "assistant"; content: string };

export default function AskChat() {
  const [messages, setMessages] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Stable per-visit session id for rate limiting.
  const sessionId = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setError(null);
    setInput("");

    const history = messages.slice(-10);
    const next: Turn[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setStreaming(true);

    // Placeholder assistant turn we append streamed text into.
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

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
        // Drop the empty assistant placeholder.
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
            // Ignore partial/non-JSON keepalive lines.
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

  return (
    <div className="mt-10 w-full max-w-xl text-left">
      <div className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "self-end rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm text-white max-w-[85%]"
                : "self-start rounded-lg bg-[var(--bg-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] max-w-[85%] whitespace-pre-wrap"
            }
          >
            {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-sm text-[var(--error)]">{error}</p>
      )}

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
