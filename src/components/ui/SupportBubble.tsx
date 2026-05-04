"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

// Pages where the bubble should NOT appear
const HIDDEN_PATHS = ["/", "/join", "/login", "/signup", "/teacher-signup", "/for-schools", "/standards", "/demo", "/venture", "/privacy"];

export default function SupportBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide on public pages and /c/* shareable card URLs
  const isPublic = HIDDEN_PATHS.includes(pathname) || pathname.startsWith("/c/") || pathname.startsWith("/parent/view") || pathname.startsWith("/auth/");
  if (isPublic) return null;

  // Auto-scroll to bottom
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId }),
      });

      const data = await res.json();

      if (res.ok && data.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        if (data.conversationId) setConversationId(data.conversationId);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error ?? "Something went wrong. Try again." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Can't reach support right now. Try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Bubble button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
          style={{ background: "#0D9488" }}
          aria-label="Open support chat"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex w-[340px] flex-col rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-xl" style={{ height: "460px" }}>
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-xl px-4 py-3" style={{ background: "#0D9488" }}>
            <div>
              <p className="text-sm font-semibold text-white">Support</p>
              <p className="text-[11px] text-white/70">Ask me anything about Adaptable</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 text-white/80 hover:text-white transition-colors"
              aria-label="Close support chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-[var(--text-secondary)]">Hi! How can I help?</p>
                <div className="mt-4 space-y-2">
                  {["I can't log in", "My lesson is stuck", "I need help with my class"].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-[#0D9488] text-white"
                      : "bg-[var(--bg-muted)] text-[var(--text-primary)]"
                  }`}
                  style={{ lineHeight: 1.5 }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-[var(--bg-muted)] px-3 py-2 text-sm text-[var(--text-muted)]">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-[var(--border)] px-3 py-2">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your issue..."
                maxLength={2000}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/30"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors disabled:opacity-40"
                style={{ background: "#0D9488" }}
                aria-label="Send message"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
