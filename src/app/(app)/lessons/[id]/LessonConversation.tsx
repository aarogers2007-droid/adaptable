"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LessonConversationProps {
  lessonId: string;
  lessonTitle: string;
  moduleName: string;
  lessonSequence: number;
  moduleSequence: number;
  progressId: string;
  isCompleted: boolean;
  nextLessonId: string | null;
  initialMessages: Message[];
  initialCheckpoints: number;
  totalCheckpoints: number;
  opener: string;
  objective: string;
  isAdmin: boolean;
}

export default function LessonConversation({
  lessonTitle,
  moduleName,
  lessonSequence,
  moduleSequence,
  progressId,
  isCompleted: initialCompleted,
  nextLessonId,
  initialMessages,
  initialCheckpoints,
  totalCheckpoints,
  opener,
  objective,
  isAdmin: initialIsAdmin,
}: LessonConversationProps) {
  const [messages, setMessages] = useState<Message[]>(() =>
    initialMessages.length > 0
      ? initialMessages
      : [{ role: "assistant", content: opener }]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(initialCompleted);
  const [checkpointsReached, setCheckpointsReached] = useState(initialCheckpoints);
  const [adminMode, setAdminMode] = useState(initialIsAdmin);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Generate suggested responses based on last AI message
  const generateSuggestions = useCallback(() => {
    const lastAiMessage = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAiMessage || loading || completed) return;

    const content = lastAiMessage.content.toLowerCase();

    // Context-aware suggestions based on what the AI asked
    if (content.includes("who specifically") || content.includes("who do you think")) {
      setSuggestions([
        "Mostly people my age at school",
        "Adults in my neighborhood who need help with this",
        "I'm not sure yet, that's what I'm trying to figure out",
      ]);
    } else if (content.includes("what price") || content.includes("what should") && content.includes("charge")) {
      setSuggestions([
        "I was thinking around $20-30",
        "I honestly have no idea where to start",
        "I looked at competitors and they charge around...",
      ]);
    } else if (content.includes("why should someone trust") || content.includes("what skill")) {
      setSuggestions([
        "I've been doing this as a hobby for a while",
        "I'm still learning but I'm passionate about it",
        "People always ask me for help with this",
      ]);
    } else if (content.includes("what could") && content.includes("different")) {
      setSuggestions([
        "I could focus on a specific niche they're ignoring",
        "I'd offer better customer service since I'm small",
        "I'm not sure how to stand out yet",
      ]);
    } else if (content.includes("?")) {
      // Generic suggestions for any question
      setSuggestions([
        "I haven't thought about that yet",
        "Let me think... I'd say",
        "Can you give me an example?",
      ]);
    } else {
      setSuggestions([]);
    }
  }, [messages, loading, completed]);

  // 15-second idle timer for showing suggestions
  const resetIdleTimer = useCallback(() => {
    setShowSuggestions(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    if (!loading && !completed && messages.length > 0) {
      idleTimerRef.current = setTimeout(() => {
        generateSuggestions();
        setShowSuggestions(true);
      }, 15000);
    }
  }, [loading, completed, messages.length, generateSuggestions]);

  // Reset timer when messages change (new AI response)
  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [messages.length, resetIdleTimer]);

  // Reset timer on typing
  function handleInputChange(value: string) {
    setInput(value);
    if (value.trim()) {
      setShowSuggestions(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    } else {
      resetIdleTimer();
    }
  }

  function useSuggestion(text: string) {
    setInput(text);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  const [nudge, setNudge] = useState<string | null>(null);

  function checkLowEffort(text: string): string | null {
    const lower = text.toLowerCase().trim();
    const fillerWords = new Set(["idk", "idc", "nothing", "fine", "ok", "okay", "yes", "no", "sure", "maybe", "nah", "nope", "yep", "yeah", "lol", "bruh", "whatever", "i guess", "dunno", "no idea"]);

    if (text.length < 20) {
      const words = lower.split(/\s+/);
      if (words.every((w) => fillerWords.has(w) || w.length <= 2)) {
        return "I want to hear your real thoughts! Can you expand on that a bit? Even a sentence or two helps me help you better.";
      }
      if (words.length <= 2 && !lower.includes("?")) {
        return "Give me a little more to work with! What are you thinking? A couple sentences goes a long way.";
      }
    }
    return null;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Low-effort check (nudge once, then let them through)
    if (!nudge) {
      const lowEffortMsg = checkLowEffort(trimmed);
      if (lowEffortMsg) {
        setNudge(lowEffortMsg);
        return;
      }
    }
    setNudge(null);

    setInput("");
    setShowSuggestions(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);

    try {
      const res = await fetch("/api/lesson-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          progressId,
          moduleSequence,
          lessonSequence,
        }),
      });

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Something went wrong. Try sending that again." },
        ]);
        setLoading(false);
        return;
      }

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
              const clean = assistantMsg
                .replace(/\[CHECKPOINT:\S+\]/g, "")
                .replace(/\[LESSON_COMPLETE\]/g, "")
                .replace(/\[STYLE:\w+\]/g, "")
                .replace(/\[PACE:\w+\]/g, "")
                .replace(/\[DETAIL:\w+\]/g, "")
                .trim();
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: clean };
                return updated;
              });
            }
            if (parsed.meta) {
              setCheckpointsReached(parsed.meta.checkpoints_reached?.length ?? checkpointsReached);
              if (parsed.meta.lesson_complete) {
                setCompleted(true);
                router.refresh();
              }
            }
          } catch {
            // Skip
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection lost. Try again." },
      ]);
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

  const progress = totalCheckpoints > 0 ? Math.round((checkpointsReached / totalCheckpoints) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)]">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[800px] items-center gap-4 px-6 py-3">
          <Link href="/dashboard" className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--primary)]">
            Adaptable
          </Link>
          <Link href={adminMode ? "/admin" : "/lessons"} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            ← {adminMode ? "Admin" : "Lessons"}
          </Link>

          {/* Admin/Student toggle */}
          {initialIsAdmin && (
            <button
              onClick={() => setAdminMode(!adminMode)}
              className={`ml-auto rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                adminMode
                  ? "bg-amber-100 text-amber-700"
                  : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"
              }`}
            >
              {adminMode ? "Admin View" : "Student View"}
            </button>
          )}

          <span className={`${initialIsAdmin ? "" : "ml-auto"} text-xs text-[var(--text-muted)]`}>
            {moduleName} · Lesson {lessonSequence}
          </span>
        </div>

        {/* Goal summary + Progress bar */}
        <div className="mx-auto max-w-[800px] px-6 pb-3">
          <div className="rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] px-4 py-2.5 mb-2">
            <p className="text-xs font-medium text-[var(--primary)]">Goal</p>
            <p className="text-sm text-[var(--text-secondary)]">{objective}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs font-medium text-[var(--text-primary)]">{lessonTitle}</p>
            <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-muted)]">
              <div
                className="h-1.5 rounded-full bg-[var(--primary)] transition-all duration-500"
                style={{ width: `${completed ? 100 : progress}%` }}
              />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {completed ? "Complete ✓" : `${checkpointsReached}/${totalCheckpoints}`}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[700px] px-6 py-6 space-y-4">
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

      {/* Completed banner */}
      {completed && (
        <div className="shrink-0 border-t border-emerald-200 bg-emerald-50 px-6 py-4">
          <div className="mx-auto max-w-[700px] flex items-center justify-between">
            <p className="text-sm font-medium text-[var(--success)]">✓ Lesson complete! Nice work.</p>
            {nextLessonId ? (
              <Link
                href={`/lessons/${nextLessonId}`}
                className="rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
              >
                Next Lesson →
              </Link>
            ) : (
              <Link
                href="/completion"
                className="rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--text-primary)] hover:brightness-110 transition-all"
              >
                See What You Built ✨
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      {!completed && (
        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg)]">
          <div className="mx-auto max-w-[700px] px-6 pt-4 pb-2">
            {/* Low-effort nudge */}
            {nudge && (
              <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-700">
                {nudge}
              </div>
            )}

            {/* Suggested responses (appear after 15s idle) */}
            {showSuggestions && suggestions.length > 0 && !nudge && (
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="text-xs text-[var(--text-muted)] self-center mr-1">Stuck?</span>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => useSuggestion(s)}
                    className="rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:border-[var(--primary)] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSend}>
              <div className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response..."
                  rows={1}
                  autoFocus
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
      )}
    </div>
  );
}
