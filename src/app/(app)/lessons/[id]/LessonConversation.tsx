"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

/**
 * Typewriter hook: reveals text character by character at a fixed speed.
 * When source text grows (streaming), the display catches up smoothly.
 * When source text is final (not streaming), display matches instantly.
 */
/**
 * TypewriterText: reveals text character by character like a video game.
 * When streaming, characters appear at a steady pace regardless of chunk size.
 * When not streaming, shows full text immediately.
 */
function TypewriterText({ text, streaming }: { text: string; streaming: boolean }) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (!streaming) {
      setDisplayed(text);
      indexRef.current = text.length;
      return;
    }

    const INTERVAL = 16; // ~60fps
    const CHARS_PER_TICK = 2;

    function tick(now: number) {
      if (now - lastTimeRef.current >= INTERVAL) {
        lastTimeRef.current = now;
        if (indexRef.current < text.length) {
          const next = Math.min(indexRef.current + CHARS_PER_TICK, text.length);
          indexRef.current = next;
          setDisplayed(text.slice(0, next));
        }
      }
      if (indexRef.current < text.length) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, streaming]);

  const paragraphs = displayed ? displayed.split(/\n\n+/).filter((p) => p.trim()) : [];

  return (
    <>
      {paragraphs.map((para, j) => (
        <p key={j} className="text-base leading-relaxed">{para}</p>
      ))}
    </>
  );
}
import Link from "next/link";
import AppNav from "@/components/ui/AppNav";
import InterviewSandbox from "@/components/interview/InterviewSandbox";
import DecisionJournal from "@/components/lessons/DecisionJournal";
import BusinessPitch from "@/components/lessons/BusinessPitch";
import { generatePersonas } from "@/lib/customer-personas";
import { saveInterviewData } from "./interview-actions";
import VoiceInput from "@/components/ui/VoiceInput";

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
  studentName: string;
  isModuleTransition: boolean;
  nextModuleName: string;
  currentModuleName: string;
  niche: string;
  targetCustomer: string;
  isLastInModule: boolean;
}

export default function LessonConversation({
  lessonId,
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
  studentName,
  isModuleTransition,
  nextModuleName,
  currentModuleName,
  niche,
  targetCustomer,
  isLastInModule,
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
  const [learningStyle, setLearningStyle] = useState({ style: "detecting...", pace: "detecting...", detail: "detecting...", motivation: "detecting...", register: "detecting...", emotion: "detecting..." });
  const [showSandbox, setShowSandbox] = useState(false);
  const [showSandboxIntro, setShowSandboxIntro] = useState(false);
  const [decisionDone, setDecisionDone] = useState(initialCompleted);
  const [pitchDone, setPitchDone] = useState(initialCompleted);
  const [checkpointCelebration, setCheckpointCelebration] = useState(false);
  const prevCheckpointsRef = useRef(initialCheckpoints);
  const [showEntrance, setShowEntrance] = useState(() => initialMessages.length === 0 && !initialCompleted);
  const [entrancePhase, setEntrancePhase] = useState<"mod" | "title" | "line" | "done">("mod");
  const [goalCollapsed, setGoalCollapsed] = useState(false);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const composingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showPacingNudge, setShowPacingNudge] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Lesson entrance sequence
  useEffect(() => {
    if (!showEntrance) return;
    const t1 = setTimeout(() => setEntrancePhase("title"), 800);
    const t2 = setTimeout(() => setEntrancePhase("line"), 1400);
    const t3 = setTimeout(() => setEntrancePhase("done"), 3500);
    const t4 = setTimeout(() => setShowEntrance(false), 4300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [showEntrance]);

  // Collapse goal after 3 messages to save space
  useEffect(() => {
    if (messages.length >= 4 && !goalCollapsed) {
      setGoalCollapsed(true);
    }
  }, [messages.length, goalCollapsed]);

  // Checkpoint celebration
  useEffect(() => {
    if (checkpointsReached > prevCheckpointsRef.current) {
      prevCheckpointsRef.current = checkpointsReached;
      setCheckpointCelebration(true);
      setTimeout(() => setCheckpointCelebration(false), 2500);
    }
  }, [checkpointsReached]);

  // Show completion overlay when lesson completes
  useEffect(() => {
    if (completed && decisionDone && pitchDone) {
      setTimeout(() => setShowCompletionOverlay(true), 500);
    }
  }, [completed, decisionDone, pitchDone]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Generate suggested responses based on last AI message.
  // Every suggestion should give the AI something real to work with.
  // No filler like "I haven't thought about that" — that stalls the conversation.
  const generateSuggestions = useCallback(() => {
    const lastAiMessage = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAiMessage || loading || completed) return;

    const content = lastAiMessage.content.toLowerCase();

    // Customer / audience questions
    if (content.includes("who") && (content.includes("customer") || content.includes("buy") || content.includes("target") || content.includes("audience"))) {
      setSuggestions([
        "Kids my age at school who already ask me about this",
        "People in my neighborhood, mostly parents and families",
        "I've seen people looking for this online but nobody local does it",
      ]);
    }
    // Pricing questions
    else if (content.includes("price") || content.includes("charge") || content.includes("cost") || content.includes("how much")) {
      setSuggestions([
        "I looked at what others charge and I think $25-35 is fair",
        "I'd start low to get my first customers, maybe $15",
        "I want to charge more than average because my quality is better",
      ]);
    }
    // Competition / differentiation
    else if (content.includes("competitor") || content.includes("different") || content.includes("stand out") || content.includes("already doing")) {
      setSuggestions([
        "The big companies don't offer the personal touch I can",
        "Nobody in my area focuses specifically on this niche",
        "My advantage is I actually understand what my customers want because I'm one of them",
      ]);
    }
    // Skills / trust / credibility
    else if (content.includes("trust") || content.includes("skill") || content.includes("qualified") || content.includes("experience")) {
      setSuggestions([
        "I've been doing this on my own for over a year",
        "People already come to me for this, I just haven't charged for it",
        "I learned from someone who does this professionally",
      ]);
    }
    // Motivation / why this business
    else if (content.includes("why") && (content.includes("business") || content.includes("venture") || content.includes("idea") || content.includes("care"))) {
      setSuggestions([
        "I noticed nobody was solving this problem in my community",
        "It started as something I love and people kept asking me to do it for them",
        "I want to build something real, not just talk about it",
      ]);
    }
    // First customers / launch / getting started
    else if (content.includes("first customer") || content.includes("first sale") || content.includes("get started") || content.includes("launch")) {
      setSuggestions([
        "I'd start with people I already know who've shown interest",
        "I could post about it on Instagram and see who responds",
        "I'd offer a free trial to 3 people and ask for honest feedback",
      ]);
    }
    // Feelings / confidence / how they feel about something
    else if (content.includes("feel") || content.includes("confident") || content.includes("ready") || content.includes("nervous")) {
      setSuggestions([
        "Honestly pretty nervous but excited at the same time",
        "More confident than when I started, I know my stuff now",
        "I feel good about the idea but unsure about the execution",
      ]);
    }
    // Agreement / correction (reaction-first pattern follow-up)
    else if (content.includes("am i getting") || content.includes("what am i") || content.includes("does that") || content.includes("sound right")) {
      setSuggestions([
        "That's close but let me correct one thing",
        "Yeah that's exactly it, you nailed it",
        "Kind of, but the real reason is different",
      ]);
    }
    // Generic fallback — still useful, never filler
    else if (content.includes("?")) {
      setSuggestions([
        "Can you give me a real example so I can picture it?",
        "I think so, but I want to make sure I understand the question",
        "That's a good question, here's what I'm thinking so far",
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
      }, 30000);
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
    setShowPacingNudge(false);
    if (value.trim()) {
      setShowSuggestions(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      // Perfectionism timer: if composing for 5+ minutes, nudge
      if (!composingTimerRef.current) {
        composingTimerRef.current = setTimeout(() => {
          setShowPacingNudge(true);
          composingTimerRef.current = null;
        }, 300000); // 5 minutes
      }
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
    setShowPacingNudge(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (composingTimerRef.current) { clearTimeout(composingTimerRef.current); composingTimerRef.current = null; }
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
        let errMsg = "Something went wrong. Try sending that again.";
        try {
          const errData = await res.json();
          errMsg = errData.error ?? errMsg;
          console.error("[lesson-chat] Error response:", res.status, errData);
        } catch {
          console.error("[lesson-chat] Non-JSON error:", res.status, res.statusText);
        }
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: errMsg },
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

              // Extract learning style before cleaning
              const styleMatch = assistantMsg.match(/\[STYLE:(\w+)\]/);
              const paceMatch = assistantMsg.match(/\[PACE:(\w+)\]/);
              const detailMatch = assistantMsg.match(/\[DETAIL:(\w+)\]/);
              const motivationMatch = assistantMsg.match(/\[MOTIVATION:(\w+)\]/);
              const registerMatch = assistantMsg.match(/\[REGISTER:(\w+)\]/);
              const emotionMatch = assistantMsg.match(/\[EMOTION:(\w+)\]/);
              if (styleMatch || paceMatch || detailMatch || motivationMatch || registerMatch || emotionMatch) {
                setLearningStyle((prev) => ({
                  style: styleMatch?.[1] ?? prev.style,
                  pace: paceMatch?.[1] ?? prev.pace,
                  detail: detailMatch?.[1] ?? prev.detail,
                  motivation: motivationMatch?.[1] ?? prev.motivation,
                  register: registerMatch?.[1] ?? prev.register,
                  emotion: emotionMatch?.[1] ?? prev.emotion,
                }));
              }

              const clean = assistantMsg
                .replace(/\[CHECKPOINT:\S+\]/g, "")
                .replace(/\[LESSON_COMPLETE\]/g, "")
                .replace(/\[STYLE:\w+\]/g, "")
                .replace(/\[PACE:\w+\]/g, "")
                .replace(/\[DETAIL:\w+\]/g, "")
                .replace(/\[MOTIVATION:\w+\]/g, "")
                .replace(/\[REGISTER:\w+\]/g, "")
                .replace(/\[EMOTION:\w+\]/g, "")
                .replace(/\[(?:CHECKPOINT|LESSON_COMPLETE|STYLE|PACE|DETAIL|MOTIVATION|REGISTER|EMOTION)[^\]]*$/g, "")
                .trim();
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: clean };
                return updated;
              });
            }
            if (parsed.meta) {
              const reached = parsed.meta.checkpoints_reached ?? [];
              setCheckpointsReached(reached.length ?? checkpointsReached);
              // Trigger Interview Sandbox when that checkpoint is reached
              if (reached.includes("interview-sandbox") && !showSandbox && !showSandboxIntro) {
                setTimeout(() => setShowSandboxIntro(true), 1000);
              }
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
    <div className="flex flex-col h-dvh lesson-atmosphere">
      {/* Lesson Entrance — chapter opening */}
      {showEntrance && (
        <div className={`lesson-entrance ${entrancePhase === "done" ? "lesson-entrance-gone" : ""}`}>
          <p className={`lesson-entrance-module ${entrancePhase !== "mod" ? "show" : ""}`}>
            Module {moduleSequence}
          </p>
          <p className={`lesson-entrance-title ${["title", "line", "done"].includes(entrancePhase) ? "show" : ""}`}>
            {lessonTitle}
          </p>
          <div className={`lesson-entrance-line ${["line", "done"].includes(entrancePhase) ? "show" : ""}`} />
        </div>
      )}

      {/* Header */}
      <div className="shrink-0">
        <AppNav isAdmin={initialIsAdmin} studentName={studentName} />
        <div className="border-b border-[var(--border)] bg-[var(--bg)]">

        {/* Goal summary + Progress bar */}
        <div className="mx-auto max-w-[800px] px-6 py-3">
          <div
            className={`lesson-goal-box rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] px-4 py-2.5 mb-2 cursor-pointer ${goalCollapsed ? "lesson-goal-collapsed" : ""}`}
            onClick={() => setGoalCollapsed(!goalCollapsed)}
          >
            <p className="text-xs font-medium text-[var(--primary)]">Goal</p>
            {!goalCollapsed && <p className="text-sm text-[var(--text-secondary)]">{objective}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Module {moduleSequence}</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{lessonTitle}</p>
            </div>
            <div className="flex-1 h-2 rounded-full bg-[var(--bg-muted)]">
              <div
                className="h-2 rounded-full checkpoint-bar"
                style={{
                  width: `${completed ? 100 : progress}%`,
                  background: "linear-gradient(90deg, #F5E642 0%, #A8DB5A 35%, #F4A79D 65%, #6DD5D0 100%)",
                }}
              />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {completed ? "Complete ✓" : `${checkpointsReached}/${totalCheckpoints}`}
            </p>
          </div>
        </div>

        {/* Checkpoint celebration */}
        {checkpointCelebration && (
          <div className="mx-auto max-w-[800px] px-6 pb-2">
            <div className="checkpoint-celebration rounded-lg px-4 py-2.5 text-center">
              <p className="text-sm font-semibold text-[var(--primary)]">
                Checkpoint reached
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {checkpointsReached}/{totalCheckpoints} complete
              </p>
            </div>
          </div>
        )}

        {/* Admin: Learning Profile Debug Panel */}
        {adminMode && (
          <div className="mx-auto max-w-[800px] px-6 pb-3">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5">
              <p className="text-xs font-medium text-amber-700 mb-1">AI Learning Profile (admin only)</p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="text-amber-600">
                  Style: <strong>{learningStyle.style}</strong>
                </span>
                <span className="text-amber-600">
                  Pace: <strong>{learningStyle.pace}</strong>
                </span>
                <span className="text-amber-600">
                  Detail: <strong>{learningStyle.detail}</strong>
                </span>
                <span className="text-amber-600">
                  Motivation: <strong>{learningStyle.motivation}</strong>
                </span>
                <span className="text-amber-600">
                  Register: <strong>{learningStyle.register}</strong>
                </span>
                <span className={`${learningStyle.emotion === "frustrated" || learningStyle.emotion === "deflated" || learningStyle.emotion === "anxious" ? "text-red-600 font-bold" : "text-amber-600"}`}>
                  Emotion: <strong>{learningStyle.emotion}</strong>
                </span>
                <span className="text-amber-600">
                  Checkpoints: <strong>{checkpointsReached}/{totalCheckpoints}</strong>
                </span>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Interview Sandbox Intro */}
      {showSandboxIntro && !showSandbox && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <p className="text-4xl mb-4">🎤</p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
              Time to practice
            </h2>
            <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
              You&apos;re about to interview 4 potential customers. Each one has a different personality.
              Your job: ask the right questions to figure out who actually needs what you&apos;re building
              and who&apos;s just being polite.
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Remember The Mom Test: ask about behavior, not opinions.
            </p>
            <button
              onClick={() => {
                setShowSandboxIntro(false);
                setShowSandbox(true);
              }}
              className="mt-6 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
            >
              Start Interviews
            </button>
          </div>
        </div>
      )}

      {/* Interview Sandbox (takes over when triggered) */}
      {showSandbox && (
        <InterviewSandbox
          personas={generatePersonas(niche, targetCustomer).map(({ id, name, age, bio }) => ({ id, name, age, bio }))}
          niche={niche}
          onComplete={async (interviews) => {
            setShowSandbox(false);
            // Save interview transcripts so they carry into future lessons
            await saveInterviewData(progressId, interviews).catch(() => {});
            // Mark the sandbox checkpoint as reached and auto-complete the lesson
            setCheckpointsReached((prev) => prev + 1);
            setCompleted(true);
            router.refresh();
          }}
        />
      )}

      {/* Messages — flowing conversation layout */}
      {!showSandbox && (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[700px] px-6 py-6 space-y-5">
          {messages.map((msg, i) => {
            const isNew = i >= initialMessages.length;
            if (msg.role === "user") {
              // Student messages: right-aligned, always fully visible
              return (
                <div key={i} className={`flex justify-end ${isNew ? "msg-enter-right" : ""}`}>
                  <div className={`max-w-[80%] rounded-2xl bg-[var(--primary)] text-white px-5 py-3 ${isNew ? "msg-land" : ""}`}>
                    <p className="text-base leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              );
            }

            // AI messages: all paragraphs visible, no pagination
            const isStreaming = i === messages.length - 1 && loading;

            return (
              <div key={i} className={`flex justify-start ${isNew ? "msg-enter" : ""}`}>
                <div className="max-w-[85%]">
                  <div className="flex items-center gap-1.5 mb-1 ml-1">
                    <div className="ikigai-icon"><div className="ikigai-icon-dot ik-d1" /><div className="ikigai-icon-dot ik-d2" /><div className="ikigai-icon-dot ik-d3" /><div className="ikigai-icon-dot ik-d4" /></div>
                    <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Guide</span>
                  </div>
                  <div className={`rounded-2xl bg-[var(--bg-muted)] text-[var(--text-primary)] px-6 py-5 min-h-[60px] space-y-3 ${!(isStreaming && !msg.content) ? "ai-message" : ""}`}>
                    {isStreaming && !msg.content ? (
                      <div className="thinking-bubble-glow flex items-center gap-1.5 py-2">
                        <span className="thinking-dot" style={{ backgroundColor: "var(--ikigai-love)" }} />
                        <span className="thinking-dot" style={{ backgroundColor: "var(--ikigai-skills)" }} />
                        <span className="thinking-dot" style={{ backgroundColor: "var(--ikigai-needs)" }} />
                      </div>
                    ) : isStreaming && msg.content ? (
                      <TypewriterText text={msg.content} streaming={true} />
                    ) : (
                      msg.content.split(/\n\n+/).filter((p: string) => p.trim()).map((para: string, j: number) => (
                        <p
                          key={j}
                          className={`text-base leading-relaxed ${isNew ? "stagger-enter" : ""}`}
                          style={isNew ? { animationDelay: `${j * 150}ms` } : undefined}
                        >
                          {para}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      )}

      {/* Post-lesson engagement: Decision Journal -> Business Pitch -> Completion banner */}
      {completed && !showSandbox && !decisionDone && (
        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg)]">
          <DecisionJournal
            lessonId={lessonId}
            onComplete={() => {
              setDecisionDone(true);
              if (!isLastInModule) setPitchDone(true);
            }}
          />
        </div>
      )}

      {completed && !showSandbox && decisionDone && isLastInModule && !pitchDone && (
        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg)]">
          <BusinessPitch
            moduleSequence={moduleSequence}
            onComplete={() => setPitchDone(true)}
          />
        </div>
      )}

      {/* Completion overlay */}
      {showCompletionOverlay && (
        <>
          <div className="lesson-dim" />
          <div className="lesson-complete-card">
            <div className="lesson-complete-check">✓</div>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--text-primary)]">
              {isModuleTransition ? `${currentModuleName} Complete` : lessonTitle}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {isModuleTransition ? `Now let's find out if people actually want what you're designing.` : "Lesson complete"}
            </p>
            {nextLessonId ? (
              <Link
                href={`/lessons/${nextLessonId}`}
                className="mt-5 inline-block rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors"
              >
                {isModuleTransition ? `Start ${nextModuleName} →` : "Next Lesson →"}
              </Link>
            ) : (
              <Link
                href="/completion"
                className="mt-5 inline-block rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:brightness-110 transition-all"
              >
                See What You Built
              </Link>
            )}
          </div>
        </>
      )}


      {/* Input */}
      {!completed && !showSandbox && (
        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg)]">
          <div className="mx-auto max-w-[700px] px-6 pt-4 pb-2">
            {/* Low-effort nudge */}
            {nudge && (
              <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-700">
                {nudge}
              </div>
            )}

            {/* Pacing nudge for perfectionists */}
            {showPacingNudge && (
              <div className="mb-3 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-2 text-sm text-[var(--text-secondary)] animate-fade-in">
                Your thinking is strong — it doesn&apos;t have to be perfect. Send what you have. You can always build on it later.
              </div>
            )}

            {/* Suggested responses (appear after 30s idle) */}
            {showSuggestions && suggestions.length > 0 && !nudge && (
              <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Suggested responses">
                <span className="text-xs text-[var(--text-muted)] self-center mr-1">Stuck?</span>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => useSuggestion(s)}
                    aria-label={`Use suggestion: ${s}`}
                    className="chip-cascade rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:border-[var(--primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                    style={{ animationDelay: `${i * 200}ms` }}
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
                  onChange={(e) => {
                    handleInputChange(e.target.value);
                    // Auto-expand textarea
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="What are you thinking?"
                  rows={1}
                  autoFocus
                  aria-label="Your response to the lesson question"
                  className="lesson-input flex-1 resize-none rounded-xl border border-[var(--border-strong)] px-4 py-3 text-base outline-none transition-all focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                  style={{ maxHeight: "150px", overflow: "auto" }}
                />
                <VoiceInput
                  onTranscription={(text) => {
                    setInput((prev) => prev ? prev + " " + text : text);
                    setShowPacingNudge(false);
                  }}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label="Send your response"
                  className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-40 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
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
