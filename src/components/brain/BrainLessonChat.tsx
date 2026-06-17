"use client";

import { useRef, useState } from "react";

// Minimal functional chat for a Larry's Brain lesson (function over form — design
// pass comes later). Streams from /api/brain-chat for the given lessonTag.

type Turn = { role: "user" | "assistant"; content: string };

export default function BrainLessonChat({ lessonTag }: { lessonTag: string }) {
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
      const res = await fetch("/api/brain-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: sessionId.current, history, lessonTag }),
      });
      if (!res.ok || !res.body) {
        let msg = "Something went wrong. Try again?";
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
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
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          try {
            const d = JSON.parse(t.slice(5).trim());
            if (d.text) {
              setMessages((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                if (last && last.role === "assistant") copy[copy.length - 1] = { ...last, content: last.content + d.text };
                return copy;
              });
            } else if (d.error) setError(d.error);
          } catch {}
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
    <div className="mt-3 w-full text-left">
      {messages.length > 0 && (
        <div className="mb-3 flex flex-col gap-3">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="self-end max-w-[85%] rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm text-white">
                {m.content}
              </div>
            ) : (
              <div key={i} className="self-start max-w-[85%] whitespace-pre-wrap rounded-lg bg-[var(--bg-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)]">
                {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
              </div>
            )
          )}
        </div>
      )}
      {error && <p className="mb-2 text-sm text-[var(--error)]">{error}</p>}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Talk it through…"
          disabled={streaming}
          maxLength={2000}
          aria-label="Talk it through with the mentor"
          className="flex-1 rounded-lg border border-[var(--border-strong)] px-4 py-2.5 text-base text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
        />
        <button
          type="submit"
          disabled={streaming || input.trim().length === 0}
          className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
        >
          {streaming ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
