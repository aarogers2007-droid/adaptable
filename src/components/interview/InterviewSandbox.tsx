"use client";

import { useState, useRef, useEffect } from "react";
import type { CustomerPersona } from "@/lib/customer-personas";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface InterviewState {
  messages: Message[];
  messageCount: number;
}

interface InterviewSandboxProps {
  personas: Pick<CustomerPersona, "id" | "name" | "age" | "bio">[];
  onComplete: (interviews: Record<string, Message[]>) => void;
  niche: string;
}

export default function InterviewSandbox({ personas, onComplete, niche }: InterviewSandboxProps) {
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<Record<string, InterviewState>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDebrief, setShowDebrief] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const completedCount = Object.values(interviews).filter((i) => i.messageCount >= 4).length;
  const allDone = completedCount >= 2; // Need at least 2 interviews to proceed

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [interviews, activePersona]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activePersona || !input.trim() || loading) return;

    const trimmed = input.trim();
    setInput("");
    setLoading(true);

    const current = interviews[activePersona] ?? { messages: [], messageCount: 0 };
    const updatedMessages = [...current.messages, { role: "user" as const, content: trimmed }];

    setInterviews((prev) => ({
      ...prev,
      [activePersona]: { messages: updatedMessages, messageCount: current.messageCount + 1 },
    }));

    try {
      const res = await fetch("/api/customer-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          personaId: activePersona,
          conversationHistory: current.messages,
        }),
      });

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";

      setInterviews((prev) => ({
        ...prev,
        [activePersona!]: {
          ...prev[activePersona!],
          messages: [...updatedMessages, { role: "assistant", content: "" }],
        },
      }));

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
              setInterviews((prev) => {
                const curr = prev[activePersona!];
                const msgs = [...curr.messages];
                msgs[msgs.length - 1] = { role: "assistant", content: assistantMsg };
                return { ...prev, [activePersona!]: { ...curr, messages: msgs } };
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch { /* network error */ }

    setLoading(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  const activeMessages = activePersona ? (interviews[activePersona]?.messages ?? []) : [];
  const activePersonaData = personas.find((p) => p.id === activePersona);

  if (showDebrief) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
          Interview Debrief
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Let's look at what you learned from each conversation.
        </p>

        <div className="mt-6 space-y-6">
          {personas.map((persona) => {
            const interview = interviews[persona.id];
            if (!interview || interview.messages.length === 0) return null;

            const studentQuestions = interview.messages.filter((m) => m.role === "user");
            const hasLeadingQuestions = studentQuestions.some((q) => {
              const lower = q.content.toLowerCase();
              return lower.includes("would you") || lower.includes("do you think") ||
                lower.includes("don't you") || lower.includes("is this a good");
            });

            return (
              <div key={persona.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-sm font-semibold text-[var(--primary)]">
                    {persona.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{persona.name}, {persona.age}</p>
                    <p className="text-xs text-[var(--text-muted)]">{studentQuestions.length} questions asked</p>
                  </div>
                </div>

                {hasLeadingQuestions && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 mb-3">
                    <p className="text-xs text-amber-700">
                      Some of your questions were opinion-based ("Would you..." / "Do you think...").
                      Notice how those got vague, enthusiastic answers that don't actually tell you anything useful?
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {studentQuestions.map((q, i) => {
                    const isLeading = q.content.toLowerCase().includes("would you") ||
                      q.content.toLowerCase().includes("do you think") ||
                      q.content.toLowerCase().includes("is this a good");
                    return (
                      <div key={i} className="flex gap-2 text-xs">
                        <span className={`shrink-0 mt-0.5 ${isLeading ? "text-amber-500" : "text-[var(--success)]"}`}>
                          {isLeading ? "△" : "●"}
                        </span>
                        <span className={isLeading ? "text-amber-700" : "text-[var(--text-secondary)]"}>
                          {q.content}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => onComplete(
            Object.fromEntries(
              Object.entries(interviews).map(([k, v]) => [k, v.messages])
            )
          )}
          className="mt-8 w-full rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
        >
          Continue to next lesson →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Persona selector */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-subtle)] px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Interview Sandbox
            </h3>
            <span className="text-xs text-[var(--text-muted)]">
              {completedCount}/{personas.length} interviewed
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {personas.map((persona) => {
              const interview = interviews[persona.id];
              const isDone = (interview?.messageCount ?? 0) >= 4;
              const isActive = activePersona === persona.id;

              return (
                <button
                  key={persona.id}
                  onClick={() => setActivePersona(persona.id)}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-left transition-colors ${
                    isActive
                      ? "border-[var(--primary)] bg-[var(--primary)]/5"
                      : isDone
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-[var(--border)] bg-[var(--bg)] hover:border-[var(--primary)]/50"
                  }`}
                >
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {isDone && "✓ "}{persona.name}, {persona.age}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] max-w-[200px] truncate">{persona.bio}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interview area */}
      {activePersona ? (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
              {activeMessages.length === 0 && activePersonaData && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-lg font-semibold text-[var(--primary)] mx-auto">
                    {activePersonaData.name[0]}
                  </div>
                  <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
                    {activePersonaData.name}, {activePersonaData.age}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                    {activePersonaData.bio}
                  </p>
                  <p className="mt-4 text-sm text-[var(--text-secondary)]">
                    Start asking questions about their experience with {niche}.
                    Remember: ask about their life, not your idea.
                  </p>
                </div>
              )}

              {activeMessages.map((msg, i) => (
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

          {/* Input */}
          <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg)]">
            <form onSubmit={handleSend} className="max-w-2xl mx-auto px-6 py-4">
              <div className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask ${activePersonaData?.name} a question...`}
                  rows={1}
                  autoFocus
                  className="flex-1 resize-none rounded-xl border border-[var(--border-strong)] px-4 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-40 transition-colors"
                >
                  Ask
                </button>
              </div>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-[var(--text-muted)]">Select a person to interview</p>
        </div>
      )}

      {/* Done button */}
      {allDone && !showDebrief && (
        <div className="shrink-0 border-t border-emerald-200 bg-emerald-50 px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <p className="text-sm text-[var(--success)]">
              You've interviewed {completedCount} people. Ready to see what you learned?
            </p>
            <button
              onClick={() => setShowDebrief(true)}
              className="rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
            >
              See Debrief →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
