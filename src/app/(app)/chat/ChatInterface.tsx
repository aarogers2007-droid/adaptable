"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/ui/AppNav";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  businessName: string;
  studentName: string;
  initialConversationId: string | null;
  initialMessages: Message[];
  isAdmin: boolean;
}

export default function ChatInterface({
  businessName,
  studentName,
  initialConversationId,
  initialMessages,
  isAdmin,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, conversationId }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setError(data.error);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError("Something went wrong. Try again.");
        setLoading(false);
        return;
      }

      // Read streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantMsg += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantMsg };
                return updated;
              });
            }
            if (parsed.conversationId) {
              setConversationId(parsed.conversationId);
            }
            if (parsed.error) {
              setError(parsed.error);
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } catch {
      setError("Failed to connect. Check your internet connection.");
    }

    setLoading(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)]">
      <div className="shrink-0">
        <AppNav isAdmin={isAdmin} studentName={studentName} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[700px] px-6 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
                AI Guide
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                Ask me anything about {businessName}. I know your niche, your customers, and where you are in the curriculum.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {[
                  "How do I find my first customers?",
                  `What should I charge for ${businessName}?`,
                  "How do I stand out from competitors?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="rounded-full bg-[var(--bg-muted)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--bg-muted)] text-[var(--text-primary)]"
                }`}
              >
                {msg.content ? (
                  <div className="space-y-2">
                    {msg.content.split(/\n\n+/).map((para, j) => (
                      <p key={j}>{para}</p>
                    ))}
                  </div>
                ) : (
                  <span className="inline-block w-4 h-4 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="shrink-0 border-t border-red-200 bg-red-50 px-6 py-2 text-center text-sm text-[var(--error)]">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg)]">
        <form onSubmit={handleSend} className="mx-auto max-w-[700px] px-6 py-4">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${businessName}...`}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-[var(--border-strong)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-40 transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
