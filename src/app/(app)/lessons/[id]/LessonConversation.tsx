"use client";

import { useState, useRef, useEffect } from "react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setInput("");
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
              // Clean hidden tags from display
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
          <Link href="/lessons" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            ← Lessons
          </Link>
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            {moduleName} · Lesson {lessonSequence}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mx-auto max-w-[800px] px-6 pb-2">
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
                {msg.content || (
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
                href="/dashboard"
                className="rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
              >
                Back to Dashboard
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      {!completed && (
        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg)]">
          <form onSubmit={handleSend} className="mx-auto max-w-[700px] px-6 py-4">
            <div className="flex gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
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
      )}
    </div>
  );
}
