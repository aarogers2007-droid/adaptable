"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BadgeDisplay } from "../../ScenariosLibrary";
import ForceLightMode from "@/components/ui/ForceLightMode";

interface CriteriaLabel {
  id: string;
  label: string;
}

interface Props {
  scenarioId: string;
  scenarioTitle: string;
  badgeName: string;
  badgeIcon: string;
  criteriaLabels: CriteriaLabel[];
  existingSession: {
    id: string;
    conversation: { role: string; content: string }[];
    criteria_satisfied: string[];
  } | null;
}

export default function ScenarioChat({
  scenarioId,
  scenarioTitle,
  badgeName,
  badgeIcon,
  criteriaLabels,
  existingSession,
}: Props) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    existingSession?.conversation ?? []
  );
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(existingSession?.id ?? null);
  const [satisfied, setSatisfied] = useState<Set<string>>(
    new Set(existingSession?.criteria_satisfied ?? [])
  );
  const [completed, setCompleted] = useState(false);
  const [badgeLevel, setBadgeLevel] = useState<number | null>(null);
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    if (!streaming) inputRef.current?.focus();
  }, [streaming]);

  // Send initial message to start conversation
  useEffect(() => {
    if (messages.length === 0 && !streaming) {
      handleSend("I'm ready to start this scenario.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || streaming) return;
    if (!text) setInput("");

    const userMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMessage]);
    setStreaming(true);

    // Add empty assistant message for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/scenario-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          scenarioId,
          sessionId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Something went wrong" }));
        setMessages((prev) => prev.slice(0, -1)); // remove empty assistant
        setStreaming(false);
        alert(err.error ?? "Error");
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);

          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.text) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  updated[updated.length - 1] = { ...last, content: last.content + parsed.text };
                }
                return updated;
              });
            }

            if (parsed.criteria_update) {
              setSatisfied((prev) => {
                const next = new Set(prev);
                for (const id of parsed.criteria_update) next.add(id);
                return next;
              });
            }

            if (parsed.all_satisfied) {
              setCompleted(true);
              setBadgeLevel(parsed.badge_level);
              setSynthesis(parsed.synthesis);
            }

            if (parsed.sessionId && !sessionId) {
              setSessionId(parsed.sessionId);
            }
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (err) {
      console.error("[scenario-chat] fetch error:", err);
      setMessages((prev) => prev.slice(0, -1));
    }

    setStreaming(false);
  }, [input, streaming, scenarioId, sessionId]);

  // Completion screen
  if (completed) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-6 py-16">
        <ForceLightMode />
        <div className="max-w-md text-center">
          <BadgeDisplay icon={badgeIcon} level={badgeLevel} size="card" />
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
            {badgeName}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Level {badgeLevel} earned
          </p>
          {synthesis && (
            <p className="mt-6 text-sm text-[var(--text-secondary)] leading-relaxed">
              {synthesis}
            </p>
          )}
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => router.push("/scenarios")}
              className="rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-dark)]"
            >
              Back to Library
            </button>
            <button
              onClick={() => {
                setCompleted(false);
                setBadgeLevel(null);
                setSynthesis(null);
                setMessages([]);
                setSatisfied(new Set());
                setSessionId(null);
                handleSend("I'm ready to start this scenario.");
              }}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Replay with a Different Approach
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-[var(--bg)]">
      <ForceLightMode />

      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3">
        <div className="mx-auto flex max-w-[640px] items-center justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--text-primary)]">
              {scenarioTitle}
            </h1>
          </div>
          <button
            onClick={() => router.push(`/scenarios/${scenarioId}`)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Criteria progress indicator */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-2">
        <div className="mx-auto flex max-w-[640px] gap-2">
          {criteriaLabels.map((c) => {
            const isSatisfied = satisfied.has(c.id);
            return (
              <div
                key={c.id}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all"
                style={{
                  background: isSatisfied ? "rgba(13, 148, 136, 0.1)" : "var(--bg-muted)",
                  color: isSatisfied ? "var(--primary)" : "var(--text-muted)",
                  border: `1px solid ${isSatisfied ? "rgba(13, 148, 136, 0.3)" : "var(--border)"}`,
                }}
              >
                <span>{isSatisfied ? "✓" : "○"}</span>
                <span>{c.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-[640px] space-y-4">
          {messages.filter((m) => m.content || m.role === "assistant").map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--bg-muted)] text-[var(--text-primary)]"
                }`}
              >
                {msg.content || (
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border)] bg-[var(--bg)] px-4 py-3">
        <div className="mx-auto flex max-w-[640px] gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 2000))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={streaming}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--primary)] disabled:opacity-50"
            placeholder="Type your response..."
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || streaming}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
